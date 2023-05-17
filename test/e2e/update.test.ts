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
    Promise.all(
      [
        [+new Date() / 1e3, email, address, JSON.stringify(['summary']), +new Date() / 1e3],
        [+new Date() / 1e3, 'unverified@test.com', address, JSON.stringify(['summary']), 0],
        [
          +new Date() / 1e3,
          email,
          '0xA57Dc1C30536B26A24d6804EBA33A586439652F2',
          JSON.stringify(['summary']),
          +new Date() / 1e3
        ],
        [
          +new Date() / 1e3,
          email,
          '0xc2E7Ba8b2D297CE5c227B79D82AD1c11B5596307',
          JSON.stringify(['summary']),
          0
        ]
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
      expect(result.length).toBe(2);
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

  describe('when passing only the address', () => {
    it('only updates the subscriptions related to the given address', async () => {
      const response = await request(process.env.HOST)
        .post('/')
        .send({
          method: 'snapshot.update',
          params: {
            email: '',
            address,
            subscriptions: ['newProposal'],
            signature: await update('', address, ['newProposal'])
          }
        });
      const result = await db.queryAsync('SELECT * FROM subscribers WHERE address = ?', [address]);

      expect(response.statusCode).toBe(200);
      expect(result.filter(r => (r.verified as number) > 0)[0].subscriptions).toEqual(
        JSON.stringify(['newProposal'])
      );
      expect(result.filter(r => (r.verified as number) === 0)[0].subscriptions).toEqual(
        JSON.stringify(['summary'])
      );
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
            signature: await update(email, '', ['newProposal'])
          }
        });
      const unverified = await db.queryAsync(
        'SELECT * FROM subscribers WHERE email = ? AND verified = 0',
        [email]
      );
      const verified = await db.queryAsync(
        'SELECT DISTINCT(subscriptions) FROM subscribers WHERE email = ? AND verified > 0',
        [email]
      );

      expect(response.statusCode).toBe(200);
      expect(unverified[0].subscriptions).toEqual(JSON.stringify(['summary']));
      expect(verified[0].subscriptions).toEqual(JSON.stringify(['newProposal']));
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

    expect(response.statusCode).toBe(401);
    expect(result.length).toBe(3);
  });
});
