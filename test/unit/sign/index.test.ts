import { subscribe, update, verifySubscribe, verifyUpdate } from '../../../src/sign';

describe('sign', () => {
  const email = 'test@test.com';
  const address = '0x123D816BF0b002bEA83a804e5cf1d2797Fcfc77d';
  const salt = `${Math.floor(+new Date() / 1e3)}`;

  describe('verifySubscribe()', () => {
    it('returns true when the signature is valid', async () => {
      const signature = await subscribe(email, address, salt);

      expect(verifySubscribe(email, address, salt, signature)).toBe(true);
    });

    it('returns false when the signature is not valid', () => {
      const signature = 'invalid-signature';

      expect(verifySubscribe(email, address, salt, signature)).toBe(false);
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
});
