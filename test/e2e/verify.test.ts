import request from 'supertest';
import db from '../../src/helpers/mysql';
import { signVerify } from '../../src/sign';
import { cleanupDb } from '../utils';

describe('POST verify', () => {
  const email = 'test-verify@test.com';
  const emailB = 'test-verify-b@test.com';
  const emailC = 'test-verify-c@test.com';
  const address = '0xDBDd4c5473692Fa0490bfF6AAbf1181f29Ca851e';
  const addressB = '0x54C8b17E5c46B97d25498205182e0382234B2532';
  const timestamp = `${Math.floor(+new Date() / 1e3)}`;

  async function subscriberData(email: string, address: string, signature?: string) {
    return {
      method: 'snapshot.verify',
      params: {
        email,
        address,
        salt: `${timestamp}`,
        signature: signature || (await signVerify(email, address, timestamp))
      }
    };
  }

  beforeEach(async () => {
    await cleanupDb();

    await Promise.all(
      [
        [timestamp, email, address, 0],
        [timestamp, emailB, addressB, 0],
        [timestamp, emailC, addressB, 1]
      ].map(async data => {
        await db.queryAsync(
          'INSERT INTO subscribers (created, email, address, verified) VALUES (?, ?, ?, ?)',
          data
        );
      })
    );
  });

  afterAll(async () => {
    await cleanupDb();
    await db.endAsync();
  });

  describe('when the email is not verified yet', () => {
    it('verifies the email', async () => {
      const response = await request(process.env.HOST)
        .post('/')
        .send(await subscriberData(email, address));
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
        .send(await subscriberData(emailC, addressB));
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
        .send(await subscriberData(emailB, addressB));
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
        .send(await subscriberData('test-not-exist@test.com', address));

      expect(response.statusCode).toBe(404);
      expect(response.body.error.message).toBe('RECORD_NOT_FOUND');
    });
  });

  it('returns an error when the signature is not valid', async () => {
    const response = await request(process.env.HOST)
      .post('/')
      .send(await subscriberData(email, address, 'not-valid'));
    const result = await db.queryAsync(
      'SELECT verified FROM subscribers WHERE email = ? AND address = ? LIMIT 1',
      [email, address]
    );

    expect(response.statusCode).toBe(401);
    expect(result[0].verified).toBe(0);
  });
});
