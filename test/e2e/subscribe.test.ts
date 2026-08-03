import request from 'supertest';
import { and, eq } from 'drizzle-orm';
import { db } from '../../src/db';
import { subscribers } from '../../src/schema';
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
    await db.$client.end();
  });

  it('adds the email and address in the database as not verified', async () => {
    const response = await request(process.env.HOST).post('/').send(payload());
    const result = await db.query.subscribers.findMany({
      where: and(eq(subscribers.email, email), eq(subscribers.address, address))
    });

    expect(response.statusCode).toBe(200);
    expect(result.length).toBe(1);
    expect(result[0].verified).toBe(0);
  });

  it('returns a success code if the email already exists', async () => {
    await insertSubscribers([
      {
        created: Math.floor(+new Date() / 1e3),
        email,
        address,
        subscriptions: null,
        verified: 0
      }
    ]);
    const response = await request(process.env.HOST).post('/').send(payload());
    const result = await db.query.subscribers.findMany({
      where: and(eq(subscribers.email, email), eq(subscribers.address, address))
    });

    expect(response.statusCode).toBe(200);
    expect(result.length).toBe(1);
    expect(result[0].verified).toBe(0);
  });
});
