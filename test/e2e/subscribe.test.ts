import request from 'supertest';
import db from '../../src/helpers/mysql';
import { cleanupDb } from './utils';
import { subscriptionPayload } from '../fixtures/subscriptionPayload';

describe('POST subscribe', () => {
  let subscriberData: Record<string, any>;
  const { email, address, signature } = subscriptionPayload;

  beforeEach(async () => {
    await cleanupDb();
    subscriberData = {
      method: 'snapshot.subscribe',
      params: {
        email,
        address,
        signature
      }
    };
  });

  afterAll(async () => {
    await cleanupDb();
    await db.end();
  });

  it('adds the email and address in the database as not verified', async () => {
    const response = await request(process.env.HOST).post('/').send(subscriberData);
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
    const response = await request(process.env.HOST).post('/').send(subscriberData);
    const result = await db.queryAsync(
      'SELECT * FROM subscribers WHERE email = ? and address = ? and verified = 0 LIMIT 1',
      [email, address]
    );

    expect(response.statusCode).toBe(200);
    expect(result.length).toBe(1);
  });

  it('returns an error code when the address is not valid', async () => {
    const response = await request(process.env.HOST)
      .post('/')
      .send({
        method: 'snapshot.subscribe',
        params: {
          email: 'test@test.com',
          address: '0xDB',
          signature
        }
      });

    expect(response.statusCode).toBe(400);
  });

  it('returns an error code if the email is missing', async () => {
    const response = await request(process.env.HOST).post('/').send({
      method: 'snapshot.subscribe',
      params: {
        address,
        signature
      }
    });

    expect(response.statusCode).toBe(400);
  });

  it('returns an error code if the address is missing', async () => {
    const response = await request(process.env.HOST).post('/').send({
      method: 'snapshot.subscribe',
      params: {
        email,
        signature
      }
    });

    expect(response.statusCode).toBe(400);
  });

  it('returns an error code if the signature is missing', async () => {
    const response = await request(process.env.HOST).post('/').send({
      method: 'snapshot.subscribe',
      params: {
        email,
        address
      }
    });

    expect(response.statusCode).toBe(400);
  });
});
