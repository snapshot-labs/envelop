import { and, eq, gt } from 'drizzle-orm';
import request from 'supertest';
import { db } from '../../src/db';
import { subscribers } from '../../src/schema';
import { signUpdate } from '../../src/sign';
import { bootstrapData, updatePayload } from '../fixtures/updatePayload';
import { cleanupSubscribersDb, insertSubscribers } from '../utils';

describe('POST update', () => {
  const { email, address, timestamp } = updatePayload;

  async function payload(subscriptions: any) {
    return {
      method: 'snapshot.update',
      params: {
        email,
        address,
        subscriptions,
        signature: await signUpdate(email, address, subscriptions)
      }
    };
  }

  beforeAll(async () => {
    await cleanupSubscribersDb(timestamp);
    return insertSubscribers(bootstrapData);
  });

  afterAll(async () => {
    await cleanupSubscribersDb(timestamp);
    await db.$client.end();
  });

  describe('without subscriptions option', () => {
    it('returns a 400 error', async () => {
      const response = await request(process.env.HOST)
        .post('/')
        .send({
          method: 'snapshot.update',
          params: {
            email,
            address,
            signature: ''
          }
        });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('with an empty subscriptions option', () => {
    it('sets the subscriptions to an empty array', async () => {
      const response = await request(process.env.HOST)
        .post('/')
        .send(await payload([]));
      const result = await db
        .selectDistinct({ subscriptions: subscribers.subscriptions })
        .from(subscribers)
        .where(
          and(
            eq(subscribers.email, email),
            eq(subscribers.address, address),
            gt(subscribers.verified, 0)
          )
        );

      expect(response.statusCode).toBe(200);
      expect(result[0].subscriptions).toEqual([]);
      expect(result.length).toBe(1);
    });
  });

  describe('with a subscriptions option', () => {
    it('updates the email subscriptions list, and ignores invalid types', async () => {
      const response = await request(process.env.HOST)
        .post('/')
        .send(await payload(['newProposal', 'invalid-type']));
      const result = await db.query.subscribers.findFirst({
        where: and(
          eq(subscribers.email, email),
          eq(subscribers.address, address)
        )
      });

      expect(response.statusCode).toBe(200);
      expect(result?.subscriptions).toEqual(['newProposal']);
    });
  });

  describe('when passing only the address', () => {
    it('only updates the subscriptions related to the given verified address', async () => {
      const response = await request(process.env.HOST)
        .post('/')
        .send({
          method: 'snapshot.update',
          params: {
            email: '',
            address,
            subscriptions: ['newProposal'],
            signature: await signUpdate('', address, ['newProposal'])
          }
        });
      const result = await db.query.subscribers.findMany({
        where: eq(subscribers.address, address)
      });

      expect(response.statusCode).toBe(200);
      expect(
        result.filter(r => (r.verified as number) > 0)[0].subscriptions
      ).toEqual(['newProposal']);
      expect(
        result.filter(r => (r.verified as number) === 0)[0].subscriptions
      ).toEqual(['summary']);
    });
  });

  describe('when passing only the email', () => {
    it('updates all subscriptions associated to the verified email', async () => {
      const response = await request(process.env.HOST)
        .post('/')
        .send({
          method: 'snapshot.update',
          params: {
            email,
            address: '',
            subscriptions: ['newProposal'],
            signature: await signUpdate(email, '', [])
          }
        });
      const unverified = await db.query.subscribers.findMany({
        where: and(eq(subscribers.email, email), eq(subscribers.verified, 0))
      });
      const verified = await db
        .selectDistinct({ subscriptions: subscribers.subscriptions })
        .from(subscribers)
        .where(and(eq(subscribers.email, email), gt(subscribers.verified, 0)));

      expect(response.statusCode).toBe(200);
      expect(unverified[0].subscriptions).toEqual(['summary']);
      expect(verified[0].subscriptions).toEqual(['newProposal']);
    });
  });

  it('returns an error code when the signature is not valid', async () => {
    const response = await request(process.env.HOST)
      .post('/')
      .send({
        method: 'snapshot.update',
        params: {
          email,
          address,
          subscriptions: ['summary'],
          signature: 'not-valid'
        }
      });
    const result = await db.query.subscribers.findMany({
      where: eq(subscribers.email, email)
    });

    expect(response.statusCode).toBe(401);
    expect(result.length).toBe(3);
  });
});
