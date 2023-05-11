import request from 'supertest';
import db from '../../src/helpers/mysql';
import { update } from '../../src/sign';
import { cleanupDb } from '../utils';

describe('POST update', () => {
  const email = 'test-unsubscribe@test.com';
  const address = '0x123D816BF0b002bEA83a804e5cf1d2797Fcfc77d';

  async function subscriberData(subscriptions: any) {
    return {
      method: 'snapshot.update',
      params: {
        email,
        address,
        subscriptions,
        signature: await update(email, address, subscriptions)
      }
    };
  }

  beforeEach(async () => {
    await cleanupDb();
    await db.queryAsync(
      'INSERT INTO subscribers (created, email, address, subscriptions, verified) VALUES (?, ?, ?, ?, ?)',
      [+new Date() / 1e3, email, address, JSON.stringify(['summary']), +new Date() / 1e3]
    );
    await db.queryAsync(
      'INSERT INTO subscribers (created, email, address, subscriptions, verified) VALUES (?, ?, ?, ?, ?)',
      [+new Date() / 1e3, email, '0x0', JSON.stringify(['summary']), +new Date() / 1e3]
    );
  });

  afterAll(async () => {
    await cleanupDb();
    await db.endAsync();
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
    it('removes the email from the database when passing en empty array', async () => {
      const response = await request(process.env.HOST)
        .post('/')
        .send(await subscriberData([]));
      const result = await db.queryAsync('SELECT * FROM subscribers WHERE email = ?', [email]);

      expect(response.statusCode).toBe(200);
      expect(result.length).toBe(1);
    });
  });

  describe('with a subscriptions option', () => {
    it('updates the email subscriptions list, and ignores invalid types', async () => {
      const response = await request(process.env.HOST)
        .post('/')
        .send(await subscriberData(['newProposal', 'invalid-type']));
      const result = await db.queryAsync(
        'SELECT * FROM subscribers WHERE email = ? and address = ? LIMIT 1',
        [email, address]
      );

      expect(response.statusCode).toBe(200);
      expect(result[0].subscriptions).toEqual(JSON.stringify(['newProposal']));
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
    const result = await db.queryAsync('SELECT * FROM subscribers WHERE email = ?', [email]);

    expect(response.statusCode).toBe(500);
    expect(result.length).toBe(2);
  });
});
