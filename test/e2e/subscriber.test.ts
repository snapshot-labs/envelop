import request from 'supertest';
import db from '../../src/helpers/mysql';
import { SUBSCRIPTION_TYPE } from '../../src/templates';
import { cleanupSubscribersDb, insertSubscribers } from '../utils';
import { VERIFIED, UNVERIFIED, NOT_SUBSCRIBED } from '../../src/helpers/utils';
import { subscriberPayload, bootstrapData } from '../fixtures/subscriberPayload';

describe('POST subscriber', () => {
  const { verifiedUser, verifiedUserWithEmptySubscription, unverifiedUser, timestamp } =
    subscriberPayload;

  beforeAll(async () => {
    await cleanupSubscribersDb(timestamp);
    return insertSubscribers(bootstrapData);
  });

  afterAll(async () => {
    await cleanupSubscribersDb(timestamp);
    await db.endAsync();
  });

  describe('when the address exists', () => {
    const { address } = verifiedUser;

    it('returns a 200 response', async () => {
      const response = await request(process.env.HOST).post('/subscriber').send({ address });

      expect(response.statusCode).toBe(200);
    });

    it('returns a list of subscriptions', async () => {
      const response = await request(process.env.HOST).post('/subscriber').send({ address });

      expect(response.body.subscriptions).toEqual(['summary']);
    });

    it('returns the default list if the subscriptions list is empty', async () => {
      const response = await request(process.env.HOST)
        .post('/subscriber')
        .send({ address: verifiedUserWithEmptySubscription.address });

      expect(response.body.subscriptions).toEqual(SUBSCRIPTION_TYPE);
    });

    it('returns a VEFIFIED state if the email is verified', async () => {
      const response = await request(process.env.HOST).post('/subscriber').send({ address });

      expect(response.body.status).toEqual(VERIFIED);
    });

    it('returns a UNVERIFIED state if the email is not verified', async () => {
      const response = await request(process.env.HOST)
        .post('/subscriber')
        .send({ address: unverifiedUser.address });

      expect(response.body.status).toEqual(UNVERIFIED);
    });
  });

  describe('when the address does not exist', () => {
    it('returns a NOT_SUBSCRIBED state', async () => {
      const response = await request(process.env.HOST)
        .post('/subscriber')
        .send({ address: 'test' });

      expect(response.statusCode).toBe(200);
      expect(response.body.status).toEqual(NOT_SUBSCRIBED);
    });
  });
});
