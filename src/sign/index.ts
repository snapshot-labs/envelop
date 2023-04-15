import { getAddress } from '@ethersproject/address';
import { Wallet, verifyTypedData } from '@ethersproject/wallet';
import { SubscribeTypes, UnsubscribeTypes } from './types';
import type { TypedDataField } from '@ethersproject/abstract-signer';

const NAME = 'envelop';
const VERSION = '1';

const domain = {
  name: NAME,
  version: VERSION
};

const signer = new Wallet(process.env.WALLET_PRIVATE_KEY as string);

const sign = async (message: Record<string, any>, type: Record<string, Array<TypedDataField>>) => {
  return await signer._signTypedData(domain, type, message);
};

function verify(
  message: Record<string, any>,
  signature: string,
  type: Record<string, Array<TypedDataField>>
) {
  try {
    const messageSigner = verifyTypedData(domain, type, message, signature);

    return messageSigner === signer.address;
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

export function verifySubscribe(email: string, address: string, signature: string) {
  return verify(
    {
      email,
      address: getAddress(address)
    },
    signature,
    SubscribeTypes
  );
}

export function unsubscribe(email: string) {
  return sign({ email }, UnsubscribeTypes);
}

export function verifyUnsubscribe(email: string, signature: string) {
  return verify({ email }, signature, UnsubscribeTypes);
}
