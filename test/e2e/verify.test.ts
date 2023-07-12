import request from 'supertest';
import db from '../../src/helpers/mysql';
import { signVerify } from '../../src/sign';
import { cleanupSubscribersDb, insertSubscribers } from '../utils';
import { verifyPayload, bootstrapData } from '../fixtures/verifyPayload';

describe('POST verify', () => {
  const {
    unverifiedUser,
    verifiedUser,
    unverifiedUserForVerifiedAddress,
    addressForNotExistEmail,
    timestamp
  } = verifyPayload;

  async function payload(email: string, address: string, signature?: string) {
    return {
      method: 'snapshot.verify',
      params: {
        email,
        address,
        salt: timestamp.toString(),
        signature: signature || (await signVerify(email, address, timestamp))
      }
    };
  }

  beforeEach(async () => {
    await cleanupSubscribersDb(timestamp);
    return insertSubscribers(bootstrapData);
  });

  afterAll(async () => {
    await cleanupSubscribersDb(timestamp);
    return db.endAsync();
  });

  describe('when the email is not verified yet', () => {
    it('verifies the email', async () => {
      const { email, address } = unverifiedUser;

      const response = await request(process.env.HOST)
        .post('/')
        .send(await payload(email, address));
      const result = await db.queryAsync(
        'SELECT verified FROM subscribers WHERE email = ? AND address = ? LIMIT 1',
        [email, address]
      );

      expect(response.statusCode).toBe(200);
      expect(result[0].verified).toBeGreaterThanOrEqual(0);
    });
  });

  describe('when the email is already verified', () => {
    it('returns a success status', async () => {
      const { email, address } = verifiedUser;

      const response = await request(process.env.HOST)
        .post('/')
        .send(await payload(email, address));
      const result = await db.queryAsync(
        'SELECT verified FROM subscribers WHERE email = ? AND address = ? LIMIT 1',
        [email, address]
      );

      expect(response.statusCode).toBe(200);
      expect(result[0].verified).toBe(1);
    });
  });

  describe('when the address is already verified with another email', () => {
    const { address, email } = unverifiedUserForVerifiedAddress;

    it('returns an error', async () => {
      const response = await request(process.env.HOST)
        .post('/')
        .send(await payload(email, address));
      const result = await db.queryAsync(
        'SELECT verified FROM subscribers WHERE email = ? AND address = ? LIMIT 1',
        [email, address]
      );

      expect(response.statusCode).toBe(400);
      expect(response.body.error.message).toBe('ADDRESS_ALREADY_VERIFIED_WITH_ANOTHER_EMAIL');
      expect(result[0].verified).toBe(0);
    });
  });

  describe('when the email does not exist', () => {
    it('returns an error', async () => {
      const response = await request(process.env.HOST)
        .post('/')
        .send(await payload('test-not-exist@test.com', addressForNotExistEmail));

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
      const result = await db.queryAsync(
        'SELECT verified FROM subscribers WHERE email = ? AND address = ? LIMIT 1',
        [email, address]
      );

      expect(response.statusCode).toBe(401);
      expect(result[0].verified).toBe(0);
    });
  });
});
