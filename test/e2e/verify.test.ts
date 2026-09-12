import { and, eq } from 'drizzle-orm';
import request from 'supertest';
import { db } from '../../src/db';
import { subscribers } from '../../src/schema';
import { signVerify } from '../../src/sign';
import { bootstrapData, verifyPayload } from '../fixtures/verifyPayload';
import { cleanupSubscribersDb, insertSubscribers } from '../utils';

describe('POST verify', () => {
  const {
    unverifiedUser,
    verifiedUser,
    secondVerifiedUserSameAddress,
    unverifiedUserForVerifiedAddress,
    addressForNotExistEmail,
    timestamp
  } = verifyPayload;

  async function payload(
    email: string,
    address: string,
    signature?: string,
    salt: string = timestamp.toString()
  ) {
    return {
      method: 'snapshot.verify',
      params: {
        email,
        address,
        salt,
        signature: signature || (await signVerify(email, address, salt))
      }
    };
  }

  beforeEach(async () => {
    await cleanupSubscribersDb(unverifiedUser.email, 'email');
    await cleanupSubscribersDb(verifiedUser.email, 'email');
    await cleanupSubscribersDb(secondVerifiedUserSameAddress.email, 'email');
    await cleanupSubscribersDb(unverifiedUserForVerifiedAddress.email, 'email');
    return insertSubscribers(bootstrapData);
  });

  afterAll(async () => {
    await cleanupSubscribersDb(unverifiedUser.email, 'email');
    await cleanupSubscribersDb(verifiedUser.email, 'email');
    await cleanupSubscribersDb(secondVerifiedUserSameAddress.email, 'email');
    await cleanupSubscribersDb(unverifiedUserForVerifiedAddress.email, 'email');
    await db.$client.end();
  });

  describe('when the email is not verified yet', () => {
    it('verifies the email', async () => {
      const { email, address } = unverifiedUser;

      const response = await request(process.env.HOST)
        .post('/')
        .send(await payload(email, address));
      const result = await db.query.subscribers.findFirst({
        columns: { verified: true },
        where: and(
          eq(subscribers.email, email),
          eq(subscribers.address, address)
        )
      });

      expect(response.statusCode).toBe(200);
      expect(result?.verified).toBeGreaterThan(0);
    });
  });

  describe('when the email is already verified', () => {
    it('returns a success status', async () => {
      const { email, address } = verifiedUser;

      const response = await request(process.env.HOST)
        .post('/')
        .send(await payload(email, address));
      const result = await db.query.subscribers.findFirst({
        columns: { verified: true },
        where: and(
          eq(subscribers.email, email),
          eq(subscribers.address, address)
        )
      });

      expect(response.statusCode).toBe(200);
      expect(result?.verified).toBe(1);
    });
  });

  describe('when the address has more than one verified email', () => {
    it('lets each verified owner re-verify idempotently', async () => {
      for (const { email, address } of [
        verifiedUser,
        secondVerifiedUserSameAddress
      ]) {
        const response = await request(process.env.HOST)
          .post('/')
          .send(await payload(email, address));

        expect(response.statusCode).toBe(200);
      }
    });
  });

  describe('when the address is submitted with different casing than it was stored', () => {
    it('is treated as the same address', async () => {
      const { email, address } = unverifiedUser;
      const differentlyCasedAddress = address.toLowerCase();

      const response = await request(process.env.HOST)
        .post('/')
        .send(await payload(email, differentlyCasedAddress));
      const result = await db.query.subscribers.findFirst({
        columns: { verified: true },
        where: and(
          eq(subscribers.email, email),
          eq(subscribers.address, address)
        )
      });

      expect(response.statusCode).toBe(200);
      expect(result?.verified).toBeGreaterThan(0);
    });
  });

  describe('when the salt is not a number', () => {
    it('returns an error instead of a server error', async () => {
      const { email, address } = unverifiedUser;

      const response = await request(process.env.HOST)
        .post('/')
        .send(await payload(email, address, undefined, 'not-a-number'));

      expect(response.statusCode).toBe(400);
      expect(response.body.error.message).toBe('INVALID_PARAMS');
    });
  });

  describe('when the salt is outside the safe integer range', () => {
    it('returns an error instead of a server error', async () => {
      const { email, address } = unverifiedUser;

      const response = await request(process.env.HOST)
        .post('/')
        .send(await payload(email, address, undefined, '1e21'));

      expect(response.statusCode).toBe(400);
      expect(response.body.error.message).toBe('INVALID_PARAMS');
    });
  });

  describe('when the address is already verified with another email', () => {
    const {
      address,
      email,
      timestamp: salt
    } = unverifiedUserForVerifiedAddress;

    it('returns an error', async () => {
      const response = await request(process.env.HOST)
        .post('/')
        .send(await payload(email, address, undefined, salt.toString()));
      const result = await db.query.subscribers.findFirst({
        columns: { verified: true },
        where: and(
          eq(subscribers.email, email),
          eq(subscribers.address, address)
        )
      });

      expect(response.statusCode).toBe(400);
      expect(response.body.error.message).toBe(
        'ADDRESS_ALREADY_VERIFIED_WITH_ANOTHER_EMAIL'
      );
      expect(result?.verified).toBe(0);
    });
  });

  describe('when the email does not exist', () => {
    it('returns an error', async () => {
      const response = await request(process.env.HOST)
        .post('/')
        .send(
          await payload('test-not-exist@test.com', addressForNotExistEmail)
        );

      expect(response.statusCode).toBe(404);
      expect(response.body.error.message).toBe('RECORD_NOT_FOUND');
    });
  });

  describe('when the signature is not valid', () => {
    it('returns an error', async () => {
      const { email, address } = unverifiedUser;

      const response = await request(process.env.HOST)
        .post('/')
        .send(await payload(email, address, 'not-valid'));
      const result = await db.query.subscribers.findFirst({
        columns: { verified: true },
        where: and(
          eq(subscribers.email, email),
          eq(subscribers.address, address)
        )
      });

      expect(response.statusCode).toBe(401);
      expect(result?.verified).toBe(0);
    });
  });
});
