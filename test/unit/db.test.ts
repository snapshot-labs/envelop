import { db } from '../../src/db';

describe('db', () => {
  describe('pool error handling', () => {
    it('does not throw when the pool emits an error', () => {
      const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);

      // A pooled connection killed server-side while idle is re-emitted by
      // pg-pool as an 'error' event on the pool. EventEmitter rethrows that
      // event when nothing listens for it, which takes the process down.
      expect(db.$client.listenerCount('error')).toBe(1);
      expect(() =>
        db.$client.emit('error', new Error('terminating connection due to administrator command'))
      ).not.toThrow();
      expect(log).toHaveBeenCalled();

      log.mockRestore();
    });
  });
});
