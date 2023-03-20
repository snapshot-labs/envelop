process.env.WALLET_PRIVATE_KEY = '1c35d78975cadb12e4047a70a38bade91d2fd9d502884785797db3e9148ec5e2';

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
