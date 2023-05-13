import { Wallet } from '@ethersproject/wallet';
import { domain, verifySubscribe } from '../../../src/sign';
import { SubscribeTypes } from '../../../src/sign/types';
import type { TypedDataField } from '@ethersproject/abstract-signer';

describe('sign', () => {
  describe('verifySubscribe', () => {
    const email = 'test@test.com';
    const privateKey = '0a5b35deb46ca896e63fcbfbce3b7fd40991b37bb313e8f9e713e9a04317053a';
    const wallet = new Wallet(privateKey);
    const address = wallet.address;

    async function signSubscribe(
      message: Record<string, any>,
      type: Record<string, Array<TypedDataField>>
    ) {
      return await wallet._signTypedData(domain, type, message);
    }

    it('returns true when the signature is valid', async () => {
      const signature = await signSubscribe({ email, address }, SubscribeTypes);

      expect(verifySubscribe(email, address, signature)).toBe(true);
    });

    it('returns false when the signature is not valid', () => {
      const signature = 'invalid-signature';

      expect(verifySubscribe(email, address, signature)).toBe(false);
    });
  });
});
