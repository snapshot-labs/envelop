import request from 'supertest';
import db from '../../src/helpers/mysql';
import { cleanupDb } from '../utils';

describe('POST subscriber', () => {
  const email = 'test-subscribe@test.com';
  const address = '0xDBDd4c5473692Fa0490bfF6AAbf1181f29Ca851e';

  beforeAll(async () => {
    await db.queryAsync(
      'INSERT INTO subscribers (created, email, address, subscriptions, verified) VALUES (?, ?, ?, ?, ?)',
      [+new Date() / 1e3, email, address, JSON.stringify(['summary']), +new Date() / 1e3]
    );
  });

  afterAll(async () => {
    await cleanupDb();
    await db.endAsync();
  });

  describe('when the address exists', () => {
    it('returns a list of subscriptions', async () => {
      const response = await request(process.env.HOST).post('/subscriber').send({ address });

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(['summary']);
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
