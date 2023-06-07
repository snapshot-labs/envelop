import db from '../../src/helpers/mysql';
import { getVerifiedSubscriptions } from '../../src/helpers/utils';
import { cleanupDb } from '../utils';

describe('utils', () => {
  describe('getVerifiedSubscriptions()', () => {
    beforeAll(async () => {
      const ts = +new Date() / 1e3;
      await Promise.all(
        [
          [ts, ts, `a@test.com`, '0x1', JSON.stringify(['summary'])],
          [ts, ts, 'b@test.com', '0x2', JSON.stringify(['summary', 'newProposal'])],
          [ts, ts, `c@test.com`, '0x3', null],
          [ts, ts, `d@test.com`, '0x4', JSON.stringify([])]
        ].map(async data => {
          await db.queryAsync(
            'INSERT INTO subscribers (created, verified, email, address, subscriptions) VALUES (?, ?, ?, ?, ?)',
            data
          );
        })
      );
    });

    afterAll(async () => {
      await cleanupDb();
      await db.endAsync();
    });

    it.each([
      ['summary', ['a@test.com', 'b@test.com', 'c@test.com']],
      ['newProposal', ['b@test.com', 'c@test.com']]
    ])('returns subscribers subscribed to the given type (%s)', async (title, results) => {
      const summarySubscribers = await getVerifiedSubscriptions(title);
      expect(summarySubscribers.map(s => s.email)).toEqual(results);
    });

    it('throws an error when the given subscription is invalid', () => {
      expect(async () => {
        await getVerifiedSubscriptions('test');
      }).rejects.toThrow();
    });
  });
});
