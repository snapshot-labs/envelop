import { getAddress } from '@ethersproject/address';
import { Wallet, verifyTypedData } from '@ethersproject/wallet';
import { SubscribeTypes, UnsubscribeTypes, VerifyTypes } from './types';
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

export function verifySubscribe(email: string, address: string, signature: string) {
  return verify(
    {
      email,
      address: getAddress(address)
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

export function verifyUnsubscribe(email: string, signature: string) {
  return verify({ email }, wallet.address, signature, UnsubscribeTypes);
}
