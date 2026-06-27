import { TypedDataField } from '@ethersproject/abstract-signer';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { db } from '../../src/db';
import { subscribers } from '../../src/schema';
import { domain, signUnsubscribe } from '../../src/sign';
import { UnsubscribeTypes } from '../../src/sign/types';
import { unsubscribePayload } from '../fixtures/unsubscribePayload';
import { cleanupSubscribersDb, insertSubscribers } from '../utils';

describe('POST unsubscribe', () => {
  const { email, address, wallet, timestamp } = unsubscribePayload;

  async function payload(args?: Record<string, string>) {
    return {
      method: 'snapshot.unsubscribe',
      params: {
        email,
        signature: await signUnsubscribe(email),
        ...args
      }
    };
  }

  beforeEach(async () => {
    await cleanupSubscribersDb(timestamp);
    return insertSubscribers([
      {
        created: timestamp,
        email,
        address,
        subscriptions: ['summary'],
        verified: timestamp
      },
      {
        created: timestamp,
        email: `a${email}`,
        address,
        subscriptions: ['summary'],
        verified: timestamp
      },
      {
        created: timestamp,
        email,
        address: '0x0',
        subscriptions: ['summary'],
        verified: timestamp
      }
    ]);
  });

  afterAll(async () => {
    await cleanupSubscribersDb(timestamp);
    await db.$client.end();
  });

  describe('when the signature is valid', () => {
    describe('when only passing the email', () => {
      it('removes all rows with the given emails from the database', async () => {
        const response = await request(process.env.HOST)
          .post('/')
          .send(await payload());
        const result = await db.query.subscribers.findMany({
          where: eq(subscribers.email, email)
        });

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

      let response: any;
      beforeEach(async () => {
        response = await request(process.env.HOST)
          .post('/')
          .send(
            await payload({
              email: '',
              address,
              signature: await signUnsubscribeFromUserWallet(
                { email: '', address },
                UnsubscribeTypes
              )
            })
          );
      });

      it('returns a 200 status code', () => {
        expect(response.statusCode).toBe(200);
      });

      it('removes the address and all its associated emails from the database', async () => {
        const toBeDeleted = await db.query.subscribers.findMany({
          where: eq(subscribers.address, address)
        });

        expect(toBeDeleted.length).toBe(0);
      });

      it('keeps all other emails not associated with the given address', async () => {
        const toBeKept = await db.query.subscribers.findMany({
          where: eq(subscribers.email, email)
        });
        expect(toBeKept.length).toBe(1);
      });
    });
  });

  describe('when the signature is not valid', () => {
    it('returns an error code', async () => {
      const beforeRun = await db.query.subscribers.findMany({
        where: eq(subscribers.email, email)
      });
      const response = await request(process.env.HOST)
        .post('/')
        .send({
          method: 'snapshot.unsubscribe',
          params: {
            email,
            signature: 'not-valid'
          }
        });
      const afterRun = await db.query.subscribers.findMany({
        where: eq(subscribers.email, email)
      });

      expect(response.statusCode).toBe(401);
      expect(beforeRun).toEqual(afterRun);
    });
  });
});
