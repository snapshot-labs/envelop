import { getAddress } from '@ethersproject/address';
import { Wallet, verifyTypedData } from '@ethersproject/wallet';
import { SubscribeTypes, SubscriptionsTypes, UnsubscribeTypes } from './types';
import type { TypedDataField } from '@ethersproject/abstract-signer';

const NAME = 'snapshot';
const VERSION = '0.1.4';

const domain = {
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

export function subscribe(email: string, address: string) {
  return sign(
    {
      email,
      address: getAddress(address)
    },
    SubscribeTypes
  );
}

export function verifySubscribe(
  email: string,
  address: string,
  signature: string,
  signer?: string
) {
  return verify(
    {
      email,
      address: getAddress(address)
    },
    signer || wallet.address,
    signature,
    SubscribeTypes
  );
}

export function unsubscribe(email: string) {
  return sign({ email }, UnsubscribeTypes);
}

export function verifyUnsubscribe(email: string, signature: string, signer?: string) {
  return verify({ email }, signer || wallet.address, signature, UnsubscribeTypes);
}

export function update(email: string, address: string, subscriptions: string[]) {
  const normalizedAddress = address.length > 0 ? address : wallet.address;
  return sign({ email, address: normalizedAddress, subscriptions }, SubscriptionsTypes);
}

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
