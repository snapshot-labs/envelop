import { Wallet } from '@ethersproject/wallet';
import {
  domain,
  verifySubscribe,
  signUpdate,
  verifyUpdate,
  signUnsubscribe,
  verifyUnsubscribe
} from '../../../src/sign';
import { SubscribeTypes, SubscriptionsTypes } from '../../../src/sign/types';
import type { TypedDataField } from '@ethersproject/abstract-signer';

describe('sign', () => {
  const email = 'test@test.com';
  const privateKey = '0a5b35deb46ca896e63fcbfbce3b7fd40991b37bb313e8f9e713e9a04317053a';
  const wallet = new Wallet(privateKey);
  const address = wallet.address;

  async function signFromUserWallet(
    message: Record<string, any>,
    type: Record<string, Array<TypedDataField>>
  ) {
    return await wallet._signTypedData(domain, type, message);
  }

  describe('verifySubscribe', () => {
    it('returns true when the signature is valid', async () => {
      const signature = await signFromUserWallet({ email, address }, SubscribeTypes);

      expect(verifySubscribe(email, address, signature)).toBe(true);
    });

    it('returns false when the signature is not valid', () => {
      const signature = 'invalid-signature';

      expect(verifySubscribe(email, address, signature)).toBe(false);
    });
  });

  describe('update()', () => {
    it('returns a signature when all params are set', async () => {
      expect(await signUpdate(email, address, ['s'])).toHaveLength(132);
    });

    it('returns a signature when subscriptions is empty', async () => {
      expect(await signUpdate(email, address, [])).toHaveLength(132);
    });

    it('returns an error when address is not an address', () => {
      expect(async () => {
        await signUpdate(email, 'test', ['s']);
      }).rejects.toThrow();
    });
  });

  describe('verifyUpdate()', () => {
    it('returns true when the signature signed by backend is valid', async () => {
      const signature = await signUpdate(email, '', ['s']);

      expect(verifyUpdate(email, '', ['s'], signature)).toBe(true);
    });

    it('returns true when the signature signed by user is valid', async () => {
      const signature = await signFromUserWallet(
        { email, address, subscriptions: ['s'] },
        SubscriptionsTypes
      );

      expect(verifyUpdate(email, address, ['s'], signature)).toBe(true);
    });

    it('returns true when the signature signed by user is valid (without email)', async () => {
      const signature = await signFromUserWallet(
        { email: '', address, subscriptions: ['s'] },
        SubscriptionsTypes
      );

      expect(verifyUpdate('', address, ['s'], signature)).toBe(true);
    });

    it('returns false when the signature is invalid', async () => {
      const signature = await signUpdate(email, address, ['s']);

      expect(verifyUpdate(email, address, ['sss'], signature)).toBe(false);
    });
  });

  describe('verifyUnsubscribe()', () => {
    it('accepts an empty email', async () => {
      const signature = await signUnsubscribe('', address);

      expect(verifyUnsubscribe('', address, signature)).toBe(true);
    });

    it('accepts an empty address', async () => {
      const signature = await signUnsubscribe(email, '');

      expect(verifyUnsubscribe(email, '', signature)).toBe(true);
    });

    it('accepts a missing address', async () => {
      const signature = await signUnsubscribe(email);

      expect(verifyUnsubscribe(email, '', signature)).toBe(true);
    });
  });
});
