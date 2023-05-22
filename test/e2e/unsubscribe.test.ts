import request from 'supertest';
import db from '../../src/helpers/mysql';
import { signUnsubscribe } from '../../src/sign';
import { cleanupDb } from '../utils';

describe('POST unsubscribe', () => {
  const email = 'test-unsubscribe@test.com';
  const address = '0xDBDd4c5473692Fa0490bfF6AAbf1181f29Ca851e';
  let subscriberData: Record<string, any>;

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
    subscriberData = {
      method: 'snapshot.unsubscribe',
      params: {
        email,
        signature: await signUnsubscribe(email)
      }
    };
  });

  afterAll(async () => {
    await cleanupDb();
    await db.endAsync();
  });

  describe('without subscriptions option', () => {
    it('removes the email from the database', async () => {
      const response = await request(process.env.HOST).post('/').send(subscriberData);
      const result = await db.queryAsync('SELECT * FROM subscribers WHERE email = ?', [email]);

      expect(response.statusCode).toBe(200);
      expect(result.length).toBe(0);
    });
  });

  describe('with an empty subscriptions option', () => {
    it.each([[''], [null], [undefined], null, undefined, ''])(
      'removes the email from the database when passing %s',
      async list => {
        const response = await request(process.env.HOST)
          .post('/')
          .send({ ...subscriberData, params: { ...subscriberData.params, subscriptions: list } });
        const result = await db.queryAsync('SELECT * FROM subscribers WHERE email = ?', [email]);

        expect(response.statusCode).toBe(200);
        expect(result.length).toBe(0);
      }
    );
  });

  describe('with a subscriptions option', () => {
    it('updates the email subscriptions list, and ignores invalid types', async () => {
      const response = await request(process.env.HOST)
        .post('/')
        .send({
          ...subscriberData,
          params: {
            ...subscriberData.params,
            subscriptions: ['newProposal', 'invalid-type', 0, null]
          }
        });
      const result = await db.queryAsync('SELECT * FROM subscribers WHERE email = ?', [email]);

      expect(response.statusCode).toBe(200);
      expect(result[0].subscriptions).toEqual(JSON.stringify(['newProposal']));
    });
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

    expect(response.statusCode).toBe(401);
    expect(result.length).toBe(2);
  });
});
