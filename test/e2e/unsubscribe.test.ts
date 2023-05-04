import request from 'supertest';
import db from '../../src/helpers/mysql';
import { unsubscribe } from '../../src/sign';
import { cleanupDb } from './utils';

describe('POST unsubscribe', () => {
  const email = 'test-unsubscribe@test.com';
  const address = '0xDBDd4c5473692Fa0490bfF6AAbf1181f29Ca851e';
  let subscriberData: Record<string, any>;

  beforeEach(async () => {
    await cleanupDb();
    await db.queryAsync(
      'INSERT INTO subscribers (created, email, address, verified) VALUES (?, ?, ?, ?)',
      [+new Date() / 1e3, email, address, +new Date() / 1e3]
    );
    await db.queryAsync(
      'INSERT INTO subscribers (created, email, address, verified) VALUES (?, ?, ?, ?)',
      [+new Date() / 1e3, email, '0x0', +new Date() / 1e3]
    );
    subscriberData = {
      method: 'snapshot.unsubscribe',
      params: {
        email,
        signature: await unsubscribe(email)
      }
    };
  });

  afterAll(async () => {
    await cleanupDb();
    await db.end();
  });

  it('removes the email from the database', async () => {
    const response = await request(process.env.HOST).post('/').send(subscriberData);
    const result = await db.queryAsync('SELECT * FROM subscribers WHERE email = ?', [email]);

    expect(response.statusCode).toBe(200);
    expect(result.length).toBe(0);
  });

  it('returns an error code when the signature is not valid', async () => {
    const response = await request(process.env.HOST)
      .post('/')
      .send({
        method: 'snapshot.unsubscribe',
        params: {
          email,
          signature: 'not-valid'
        }
      });
    const result = await db.queryAsync('SELECT * FROM subscribers WHERE email = ?', [email]);

    expect(response.statusCode).toBe(500);
    expect(result.length).toBe(2);
  });
});
