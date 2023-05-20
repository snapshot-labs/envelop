import {
  subscribe,
  update,
  unsubscribe,
  verifySubscribe,
  verifyUpdate,
  verifyUnsubscribe
} from '../../../src/sign';

describe('sign', () => {
  const email = 'test@test.com';
  const address = '0x123D816BF0b002bEA83a804e5cf1d2797Fcfc77d';

  describe('verifySubscribe()', () => {
    it('returns true when the signature is valid', async () => {
      const signature = await subscribe(email, address);

      expect(verifySubscribe(email, address, signature)).toBe(true);
    });

    it('returns false when the signature is not valid', () => {
      const signature = 'invalid-signature';

      expect(verifySubscribe(email, address, signature)).toBe(false);
    });
  });

  describe('update()', () => {
    it('returns a signature when all params are set', async () => {
      expect(await update(email, address, ['s'])).toHaveLength(132);
    });

    it('returns a signature when subscriptions is empty', async () => {
      expect(await update(email, address, [])).toHaveLength(132);
    });

    it('returns an error when address is not an address', () => {
      expect(async () => {
        await update(email, 'test', ['s']);
      }).rejects.toThrow();
    });
  });

  describe('verifyUpdate()', () => {
    it('returns true when the signature is valid', async () => {
      const signature = await update(email, address, ['s']);

      expect(verifyUpdate(email, address, ['s'], signature)).toBe(true);
    });

    it('returns false when the signature is invalid', async () => {
      const signature = await update(email, address, ['s']);

      expect(verifyUpdate(email, address, ['sss'], signature)).toBe(false);
    });
  });

  describe('verifyUnsubscribe()', () => {
    it('accepts an empty email', async () => {
      const signature = await unsubscribe('', address);

      expect(verifyUnsubscribe('', address, signature)).toBe(true);
    });

    it('accepts an empty address', async () => {
      const signature = await unsubscribe(email, '');

      expect(verifyUnsubscribe(email, '', signature)).toBe(true);
    });

    it('accepts a missing address', async () => {
      const signature = await unsubscribe(email);

      expect(verifyUnsubscribe(email, '', signature)).toBe(true);
    });
  });
});
