import request from 'supertest';
import db from '../../src/helpers/mysql';
import { signUpdate } from '../../src/sign';
import { cleanupSubscribersDb, randomTimestamp } from '../utils';

describe('POST update', () => {
  const email = 'test-update@test.com';
  const address = '0x123D816BF0b002bEA83a804e5cf1d2797Fcfc77d';
  const timestamp = randomTimestamp().toString();

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
    return Promise.all(
      [
        [timestamp, email, address, JSON.stringify(['summary']), timestamp],
        [timestamp, 'unverified@test.com', address, JSON.stringify(['summary']), 0],
        [
          timestamp,
          email,
          '0xA57Dc1C30536B26A24d6804EBA33A586439652F2',
          JSON.stringify(['summary']),
          timestamp
        ],
        [
          timestamp,
          email,
          '0xc2E7Ba8b2D297CE5c227B79D82AD1c11B5596307',
          JSON.stringify(['summary']),
          0
        ]
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
      const result = await db.queryAsync(
        'SELECT DISTINCT(subscriptions) FROM subscribers WHERE email = ? and ADDRESS = ? AND verified > 0',
        [email, address]
      );

      expect(response.statusCode).toBe(200);
      expect(result[0].subscriptions).toEqual(JSON.stringify([]));
      expect(result.length).toBe(1);
    });
  });

  describe('with a subscriptions option', () => {
    it('updates the email subscriptions list, and ignores invalid types', async () => {
      const response = await request(process.env.HOST)
        .post('/')
        .send(await payload(['newProposal', 'invalid-type']));
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
            signature: await signUpdate('', address, ['newProposal'])
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
            signature: await signUpdate(email, '', [])
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
