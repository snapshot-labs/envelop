import request from 'supertest';
import db from '../../src/helpers/mysql';
import { SUBSCRIPTION_TYPE } from '../../src/templates';
import { cleanupSubscribersDb, randomTimestamp } from '../utils';

describe('POST subscriber', () => {
  const email = 'test-subscriber@test.com';
  const address = '0xDBDd4c5473692Fa0490bfF6AAbf1181f29Ca851e';
  const addressB = '0x54C8b17E5c46B97d25498205182e0382234B2532';
  const notVerifiedAddress = '0xc766c83C362E6D1Da8151F6aB588de7C79d03B8d';
  const timestamp = randomTimestamp().toString();

  beforeAll(async () => {
    await cleanupSubscribersDb(timestamp);
    return Promise.all(
      [
        [timestamp, `a${email}`, address, JSON.stringify(['summary']), 0],
        [timestamp, email, address, JSON.stringify(['summary']), timestamp],
        [timestamp, `b${email}`, addressB, null, timestamp],
        [timestamp, `c${email}`, notVerifiedAddress, null, 0]
      ].map(data => {
        return db.queryAsync(
          'INSERT INTO subscribers (created, email, address, subscriptions, verified) VALUES (?, ?, ?, ?, ?)',
          data
        );
      })
    );
  });

  afterAll(async () => {
    await cleanupSubscribersDb(timestamp);
    return db.endAsync();
  });

  describe('when the address exists', () => {
    it('returns a 200 response', async () => {
      const response = await request(process.env.HOST)
        .post('/subscriber')
        .send({ address: addressB });

      expect(response.statusCode).toBe(200);
    });

    it('returns a list of subscriptions', async () => {
      const response = await request(process.env.HOST).post('/subscriber').send({ address });

      expect(response.body.subscriptions).toEqual(['summary']);
    });

    it('returns the default list if the subscriptions list is empty', async () => {
      const response = await request(process.env.HOST)
        .post('/subscriber')
        .send({ address: addressB });

      expect(response.body.subscriptions).toEqual(SUBSCRIPTION_TYPE);
    });

    it('returns a VEFIFIED state if the email is verified', async () => {
      const response = await request(process.env.HOST).post('/subscriber').send({ address });

      expect(response.body.status).toEqual('VERIFIED');
    });

    it('returns a UNVERIFIED state if the email is not verified', async () => {
      const response = await request(process.env.HOST)
        .post('/subscriber')
        .send({ address: notVerifiedAddress });

      expect(response.body.status).toEqual('UNVERIFIED');
    });
  });

  describe('when the address does not exist', () => {
    it('returns a NOT_SUBSCRIBED state', async () => {
      const response = await request(process.env.HOST)
        .post('/subscriber')
        .send({ address: 'test' });

      expect(response.statusCode).toBe(200);
      expect(response.body.status).toEqual('NOT_SUBSCRIBED');
    });
  });
});
