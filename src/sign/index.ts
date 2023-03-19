import { getAddress } from '@ethersproject/address';
import { ethers } from 'ethers';
import { Subscriber, SubscriberTypes } from './types';

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

const signer = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY as string);

export const sign = async (email: string, address: string): Promise<string> => {
  return await signer._signTypedData(domain, SubscriberTypes, buildValue(email, address));
};

export const verify = (email: string, address: string, signature: string): boolean => {
  const messageSigner = ethers.utils.verifyTypedData(
    domain,
    SubscriberTypes,
    buildValue(email, address),
    signature
  );

  return messageSigner === signer.address;
};
