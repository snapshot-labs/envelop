import { and, eq } from 'drizzle-orm';
import { db } from '../../src/db';
import {
  getVerifiedSubscriptions,
  markBounced,
  subscribe,
  verify
} from '../../src/helpers/utils';
import { subscribers } from '../../src/schema';
import {
  cleanupSubscribersDb,
  insertSubscribers,
  randomTimestamp
} from '../utils';

const created = randomTimestamp();
const address = '0xbouncetest';

function row(email: string, overrides: Record<string, any> = {}) {
  return {
    email,
    address,
    created,
    verified: created,
    subscriptions: null,
    ...overrides
  };
}

function find(email: string) {
  return db.query.subscribers.findFirst({
    where: and(eq(subscribers.email, email), eq(subscribers.address, address))
  });
}

describe('bounced subscribers', () => {
  beforeEach(() => {
    return cleanupSubscribersDb(created);
  });

  afterAll(async () => {
    await cleanupSubscribersDb(created);
    await db.$client.end();
  });

  describe('getVerifiedSubscriptions()', () => {
    it('skips a subscriber whose address bounced', async () => {
      await insertSubscribers([
        row('live@bounce-test.com'),
        row('gone@bounce-test.com', { bounced: created })
      ]);

      const emails = (await getVerifiedSubscriptions('summary')).map(
        subscriber => subscriber.email
      );

      expect(emails).toContain('live@bounce-test.com');
      expect(emails).not.toContain('gone@bounce-test.com');
    });
  });

  describe('markBounced()', () => {
    it('flags the subscriber and reports how many were flagged', async () => {
      await insertSubscribers([row('gone@bounce-test.com')]);

      expect(await markBounced(['gone@bounce-test.com'])).toBe(1);
      expect((await find('gone@bounce-test.com'))?.bounced).toBeGreaterThan(0);
    });

    it('matches an address reported in a different case', async () => {
      await insertSubscribers([row('MixedCase@bounce-test.com')]);

      expect(await markBounced(['mixedcase@bounce-test.com'])).toBe(1);
      expect(
        (await find('MixedCase@bounce-test.com'))?.bounced
      ).toBeGreaterThan(0);
    });

    it('keeps the first timestamp when an address is reported again', async () => {
      await insertSubscribers([
        row('gone@bounce-test.com', { bounced: created })
      ]);

      expect(await markBounced(['gone@bounce-test.com'])).toBe(0);
      expect((await find('gone@bounce-test.com'))?.bounced).toBe(created);
    });

    it('ignores addresses that are not subscribers', async () => {
      expect(await markBounced(['stranger@bounce-test.com'])).toBe(0);
    });

    it('does nothing when there is nothing to flag', async () => {
      expect(await markBounced([])).toBe(0);
    });
  });

  describe('recovering a bounced address', () => {
    const email = 'recovered@bounce-test.com';

    it('clears the flag and asks for a new verification when subscribing again', async () => {
      await insertSubscribers([row(email, { bounced: created })]);

      const subscriber = await subscribe(email, address);

      // Returned, so that rpc queues a verification email, and carrying the
      // original created so the link in it matches the row.
      expect(subscriber).toEqual({ email, address, created });

      const result = await find(email);
      expect(result?.bounced).toBe(0);
      expect(result?.verified).toBe(0);
    });

    it('leaves a subscriber that has not bounced alone', async () => {
      await insertSubscribers([row(email)]);

      expect(await subscribe(email, address)).toBeNull();
      expect((await find(email))?.verified).toBe(created);
    });

    it('clears the flag once the address is verified', async () => {
      await insertSubscribers([row(email, { verified: 0, bounced: created })]);

      await verify(email, address, created.toString());

      const result = await find(email);
      expect(result?.bounced).toBe(0);
      expect(result?.verified).toBeGreaterThan(0);
    });
  });
});
