import { getAddress } from '@ethersproject/address';
import { Wallet, verifyTypedData } from '@ethersproject/wallet';
import { Subscriber, SubscribeTypes, UnsubscribeTypes } from './types';

const NAME = 'envelop';
const VERSION = '1';

const domain = {
  name: NAME,
  version: VERSION
};

const buildValue = (email: string, address: string): Subscriber => {
  return {
    email,
    address: getAddress(address)
  };
};

const signer = new Wallet(process.env.WALLET_PRIVATE_KEY as string);

const sign = async (message, type): Promise<string> => {
  return await signer._signTypedData(domain, type, message);
};

const verify = (message, signature: string, type): boolean => {
  try {
    const messageSigner = verifyTypedData(domain, type, message, signature);

    return messageSigner === signer.address;
  } catch (e) {
    return false;
  }
};

export const subscribe = (email: string, address: string) => {
  return sign(buildValue(email, address), SubscribeTypes);
};

export const unsubscribe = (email: string) => {
  return sign({ email }, UnsubscribeTypes);
};

export const verifySubscribe = (email: string, address: string, signature: string) => {
  return verify(buildValue(email, address), signature, SubscribeTypes);
};

export const verifyUnsubscribe = (email: string, signature: string) => {
  return verify({ email }, signature, UnsubscribeTypes);
};
