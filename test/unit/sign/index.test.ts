import { subscribe, verifySubscribe } from '../../../src/sign';

describe('sign', () => {
  describe('verifySubscribe', () => {
    const email = 'test@test.com';
    const address = '0x606535Dd25917855384811C9850D00d011EC1Eb8';

    it('returns true when the signature is valid', async () => {
      const signature = await subscribe(email, address);

      expect(verifySubscribe(email, address, signature)).toBe(true);
    });

    it('returns false when the signature is not valid', () => {
      const signature = 'invalid-signature';

      expect(verifySubscribe(email, address, signature)).toBe(false);
    });
  });
});
