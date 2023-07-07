import request from 'supertest';
import db from '../../src/helpers/mysql';
import { subscriptionPayload } from '../fixtures/subscriptionPayload';
import { cleanupSubscribersDb } from '../utils';

describe('POST subscribe', () => {
  const { email, address, signature } = subscriptionPayload;

  function payload() {
    return {
      method: 'snapshot.subscribe',
      params: {
        email,
        address,
        signature
      }
    };
  }

  beforeEach(() => {
    return cleanupSubscribersDb(email, 'email');
  });

  afterAll(async () => {
    await cleanupSubscribersDb(email, 'email');
    return db.endAsync();
  });

  it('adds the email and address in the database as not verified', async () => {
    const response = await request(process.env.HOST).post('/').send(payload());
    const result = await db.queryAsync(
      'SELECT * FROM subscribers WHERE email = ? and address = ? and verified = 0 LIMIT 1',
      [email, address]
    );

    expect(response.statusCode).toBe(200);
    expect(result.length).toBe(1);
  });

  it('returns a success code if the email already exists', async () => {
    await db.queryAsync(
      'INSERT INTO subscribers (created, email, address, verified) VALUES (?, ?, ?, 0)',
      [+new Date() / 1e3, email, address]
    );
    const response = await request(process.env.HOST).post('/').send(payload());
    const result = await db.queryAsync(
      'SELECT * FROM subscribers WHERE email = ? and address = ? and verified = 0 LIMIT 1',
      [email, address]
    );

    expect(response.statusCode).toBe(200);
    expect(result.length).toBe(1);
  });
});
