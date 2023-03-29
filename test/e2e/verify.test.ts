import request from 'supertest';
import db from '../../src/helpers/mysql';
import { subscribe } from '../../src/sign';
import { cleanupDb } from './utils';

describe('POST verify', () => {
  const email = 'test-verify@test.com';
  const address = '0xDBDd4c5473692Fa0490bfF6AAbf1181f29Ca851e';
  let subscriberData;

  beforeEach(async () => {
    await cleanupDb();
    await db.queryAsync(
      'INSERT INTO subscribers (created, email, address, verified) VALUES (?, ?, ?, 0)',
      [+new Date() / 1e3, email, address]
    );

    subscriberData = {
      method: 'snapshot.verify',
      params: {
        email,
        address,
        signature: await subscribe(email, address)
      }
    };
  });

  afterAll(async () => {
    await cleanupDb();
    await db.end();
  });

  it('verify the email', async () => {
    const response = await request(process.env.HOST).post('/').send(subscriberData);
    const result = await db.queryAsync('SELECT verified FROM subscribers WHERE email = ? LIMIT 1', [
      email
    ]);

    expect(response.statusCode).toBe(200);
    expect(result[0].verified).toBeGreaterThanOrEqual(0);
  });

  it('returns an error when the signature is not valid', async () => {
    const response = await request(process.env.HOST)
      .post('/')
      .send({
        method: 'snapshot.verify',
        params: {
          email,
          address,
          signature: 'not-valid'
        }
      });
    const result = await db.queryAsync('SELECT verified FROM subscribers WHERE email = ? LIMIT 1', [
      email
    ]);

    expect(response.statusCode).toBe(500);
    expect(result[0].verified).toBe(0);
  });
});
