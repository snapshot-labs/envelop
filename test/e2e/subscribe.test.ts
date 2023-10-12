import request from 'supertest';
import db from '../../src/helpers/mysql';
import { subscribePayload } from '../fixtures/subscribePayload';
import { cleanupSubscribersDb, insertSubscribers } from '../utils';

describe('POST subscribe', () => {
  const { email, address, signature } = subscribePayload;

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
  });

  it('adds the email and address in the database as not verified', async () => {
    const response = await request(process.env.HOST).post('/').send(payload());
    const result = await db.queryAsync(
      'SELECT * FROM subscribers WHERE email = ? and address = ?',
      [email, address]
    );

    expect(response.statusCode).toBe(200);
    expect(result.length).toBe(1);
    expect(result[0].verified).toBe(0);
  });

  it('returns a success code if the email already exists', async () => {
    await insertSubscribers([[+new Date() / 1e3, email, address, null, 0]]);
    const response = await request(process.env.HOST).post('/').send(payload());
    const result = await db.queryAsync(
      'SELECT * FROM subscribers WHERE email = ? and address = ?',
      [email, address]
    );

    expect(response.statusCode).toBe(200);
    expect(result.length).toBe(1);
    expect(result[0].verified).toBe(0);
  });
});
