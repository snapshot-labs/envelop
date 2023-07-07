import request from 'supertest';
import db from '../../src/helpers/mysql';
import { signVerify } from '../../src/sign';
import { cleanupSubscribersDb, randomTimestamp } from '../utils';

describe('POST verify', () => {
  const email = 'test-verify@test.com';
  const emailB = 'test-verify-b@test.com';
  const emailC = 'test-verify-c@test.com';
  const address = '0xDBDd4c5473692Fa0490bfF6AAbf1181f29Ca851e';
  const addressB = '0x54C8b17E5c46B97d25498205182e0382234B2532';
  const addressForNotExistEmail = '0xeF91cf65Ed49804B4b54f4cB9af6aC793f1CC32c';
  const unverifiedEmailForInvalidSignature = 'test-verify-d@test.com';
  const unverifiedAddressForInvalidSignature = '0xcd880A59D8FF543FFDa28EcD624dd9cEf9EFc0FE';
  const timestamp = randomTimestamp().toString();

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

  beforeAll(async () => {
    await cleanupSubscribersDb(timestamp);
    return Promise.all(
      [
        [timestamp, email, address, 0],
        [timestamp, emailB, addressB, 0],
        [timestamp, emailC, addressB, 1],
        [timestamp, unverifiedEmailForInvalidSignature, unverifiedAddressForInvalidSignature, 0]
      ].map(data => {
        return db.queryAsync(
          'INSERT INTO subscribers (created, email, address, verified) VALUES (?, ?, ?, ?)',
          data
        );
      })
    );
  });

  afterAll(async () => {
    await cleanupSubscribersDb(timestamp);
    return db.endAsync();
  });

  describe('when the email is not verified yet', () => {
    it('verifies the email', async () => {
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
      const response = await request(process.env.HOST)
        .post('/')
        .send(await payload(emailC, addressB));
      const result = await db.queryAsync(
        'SELECT verified FROM subscribers WHERE email = ? AND address = ? LIMIT 1',
        [emailC, addressB]
      );

      expect(response.statusCode).toBe(200);
      expect(result[0].verified).toBe(1);
    });
  });

  describe('when the address is already verified with another email', () => {
    it('returns an error', async () => {
      const response = await request(process.env.HOST)
        .post('/')
        .send(await payload(emailB, addressB));
      const result = await db.queryAsync(
        'SELECT verified FROM subscribers WHERE email = ? AND address = ? LIMIT 1',
        [emailB, addressB]
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
      const response = await request(process.env.HOST)
        .post('/')
        .send(
          await payload(
            unverifiedEmailForInvalidSignature,
            unverifiedAddressForInvalidSignature,
            'not-valid'
          )
        );
      const result = await db.queryAsync(
        'SELECT verified FROM subscribers WHERE email = ? AND address = ? LIMIT 1',
        [unverifiedEmailForInvalidSignature, unverifiedAddressForInvalidSignature]
      );

      expect(response.statusCode).toBe(401);
      expect(result[0].verified).toBe(0);
    });
  });
});
