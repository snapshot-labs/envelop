import { getAddress } from '@ethersproject/address';
import { Wallet, verifyTypedData } from '@ethersproject/wallet';
import { SubscribeTypes, UnsubscribeTypes, VerifyTypes, SubscriptionsTypes } from './types';
import type { TypedDataField } from '@ethersproject/abstract-signer';

const NAME = 'snapshot';
const VERSION = '0.1.4';

export const domain = {
  name: NAME,
  version: VERSION
};

const wallet = new Wallet(process.env.WALLET_PRIVATE_KEY as string);

const sign = async (message: Record<string, any>, type: Record<string, Array<TypedDataField>>) => {
  return await wallet._signTypedData(domain, type, message);
};

function verify(
  message: Record<string, any>,
  signer: string,
  signature: string,
  type: Record<string, Array<TypedDataField>>
) {
  try {
    return signer === verifyTypedData(domain, type, message, signature);
  } catch (e) {
    return false;
  }
}

export function subscribe(email: string, address: string, salt: string) {
  return sign(
    {
      email,
      address: getAddress(address),
      salt
    },
    SubscribeTypes
  );
}

export function verifySubscribe(email: string, address: string, salt: string, signature: string) {
  return verify(
    {
      email,
      address: getAddress(address),
      salt
    },
    getAddress(address),
    signature,
    SubscribeTypes
  );
}

export function signVerify(email: string, address: string) {
  return sign(
    {
      email,
      address: getAddress(address)
    },
    VerifyTypes
  );
}

export function verifyVerify(email: string, address: string, signature: string) {
  return verify(
    {
      email,
      address: getAddress(address)
    },
    wallet.address,
    signature,
    VerifyTypes
  );
}

export function signUnsubscribe(email: string) {
  return sign({ email }, UnsubscribeTypes);
}

export function verifyUnsubscribe(email: string, signature: string, signer?: string) {
  return verify({ email }, signer || wallet.address, signature, UnsubscribeTypes);
}

export function signUpdate(email: string, address: string, subscriptions: string[]) {
  const normalizedAddress = address.length > 0 ? address : wallet.address;
  return sign({ email, address: normalizedAddress, subscriptions }, SubscriptionsTypes);
}

/**
 * Verify the UPDATE transaction signature
 *
 * The signature returned by `signUpdate()` can be signed by either:
 * - the backend (when `address` params is empty),
 * - the user himself (when the `address` params is present)
 */
export function verifyUpdate(
  email: string,
  address: string,
  subscriptions: string[],
  signature: string
) {
  const normalizedAddress = address.length > 0 ? address : wallet.address;
  return verify(
    { email, address: normalizedAddress, subscriptions },
    normalizedAddress,
    signature,
    SubscriptionsTypes
  );
}
