import request from 'supertest';
import { Wallet } from '@ethersproject/wallet';
import db from '../../src/helpers/mysql';
import { domain, unsubscribe } from '../../src/sign';
import { cleanupDb } from '../utils';
import { UnsubscribeTypes } from '../../src/sign/types';
import type { TypedDataField } from '@ethersproject/abstract-signer';

describe('POST unsubscribe', () => {
  const email = 'test-unsubscribe@test.com';
  const privateKey = '0a5b35deb46ca896e63fcbfbce3b7fd40991b37bb313e8f9e713e9a04317053a';
  const wallet = new Wallet(privateKey);
  const address = wallet.address;
  let subscriberData: Record<string, any>;

  beforeEach(async () => {
    await cleanupDb();
    await db.queryAsync(
      'INSERT INTO subscribers (created, email, address, subscriptions, verified) VALUES (?, ?, ?, ?, ?)',
      [+new Date() / 1e3, email, address, JSON.stringify(['summary']), +new Date() / 1e3]
    );
    await db.queryAsync(
      'INSERT INTO subscribers (created, email, address, subscriptions, verified) VALUES (?, ?, ?, ?, ?)',
      [+new Date() / 1e3, `a${email}`, address, JSON.stringify(['summary']), +new Date() / 1e3]
    );
    await db.queryAsync(
      'INSERT INTO subscribers (created, email, address, subscriptions, verified) VALUES (?, ?, ?, ?, ?)',
      [+new Date() / 1e3, email, '0x0', JSON.stringify(['summary']), +new Date() / 1e3]
    );
    subscriberData = {
      method: 'snapshot.unsubscribe',
      params: {
        email,
        signature: await unsubscribe(email)
      }
    };
  });

  afterAll(async () => {
    await cleanupDb();
    await db.endAsync();
  });

  describe('when the signature is valid', () => {
    describe('when only passing the email', () => {
      it('removes all rows with the given emails from the database', async () => {
        const response = await request(process.env.HOST).post('/').send(subscriberData);
        const result = await db.queryAsync('SELECT * FROM subscribers WHERE email = ?', [email]);

        expect(response.statusCode).toBe(200);
        expect(result.length).toBe(0);
      });
    });

    describe('when only passing an address', () => {
      async function signUnsubscribeFromUserWallet(
        message: Record<string, any>,
        type: Record<string, Array<TypedDataField>>
      ) {
        return await wallet._signTypedData(domain, type, message);
      }

      it('removes the address and all its associated emails from the database', async () => {
        const response = await request(process.env.HOST)
          .post('/')
          .send({
            method: 'snapshot.unsubscribe',
            params: {
              email: '',
              address,
              signature: await signUnsubscribeFromUserWallet(
                { email: '', address },
                UnsubscribeTypes
              )
            }
          });
        const toBeDeleted = await db.queryAsync('SELECT * FROM subscribers WHERE address', [
          address
        ]);
        const toBeKept = await db.queryAsync('SELECT * FROM subscribers WHERE email = ?', [email]);

        expect(response.statusCode).toBe(200);
        expect(toBeDeleted.length).toBe(0);
        expect(toBeKept.length).toBe(1);
      });
    });
  });

  describe('when the signature is not valid', () => {
    it('returns an error code', async () => {
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
});
