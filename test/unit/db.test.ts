import { db } from '../../src/db';

describe('db', () => {
  describe('pool error handling', () => {
    it('does not throw when the pool emits an error', () => {
      const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);

      expect(db.$client.listenerCount('error')).toBe(1);
      expect(() =>
        db.$client.emit('error', new Error('terminating connection due to administrator command'))
      ).not.toThrow();
      expect(log).toHaveBeenCalled();

      log.mockRestore();
    });
  });
});
