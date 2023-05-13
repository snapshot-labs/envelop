import request from 'supertest';
import db from '../../src/helpers/mysql';
import { SUBSCRIPTION_TYPE } from '../../src/templates';
import { cleanupDb } from '../utils';

describe('POST subscriber', () => {
  const email = 'test-subscribe@test.com';
  const address = '0xDBDd4c5473692Fa0490bfF6AAbf1181f29Ca851e';
  const addressB = '0x54C8b17E5c46B97d25498205182e0382234B2532';

  beforeAll(async () => {
    await Promise.all(
      [
        [+new Date() / 1e3, `a${email}`, address, JSON.stringify(['summary']), 0],
        [+new Date() / 1e3, email, address, JSON.stringify(['summary']), +new Date() / 1e3],
        [+new Date() / 1e3, `b${email}`, addressB, null, +new Date() / 1e3]
      ].map(async data => {
        await db.queryAsync(
          'INSERT INTO subscribers (created, email, address, subscriptions, verified) VALUES (?, ?, ?, ?, ?)',
          data
        );
      })
    );
  });

  afterAll(async () => {
    await cleanupDb();
    await db.endAsync();
  });

  describe('when the address exists', () => {
    it('returns a list of subscriptions for the verified email', async () => {
      const response = await request(process.env.HOST).post('/subscriber').send({ address });

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(['summary']);
    });

    it('returns the default list if the subscriptions list is empty', async () => {
      const response = await request(process.env.HOST)
        .post('/subscriber')
        .send({ address: addressB });

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(SUBSCRIPTION_TYPE);
    });
  });

  describe('when the address does not exist', () => {
    it('returns a 404 error', async () => {
      const response = await request(process.env.HOST)
        .post('/subscriber')
        .send({ address: 'test' });

      expect(response.statusCode).toBe(404);
    });
  });
});
