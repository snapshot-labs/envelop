import { getAddress } from '@ethersproject/address';
import { Wallet, verifyTypedData } from '@ethersproject/wallet';
import { Subscription, SubscriptionTypes } from './types';

const NAME = 'envelop';
const VERSION = '1';

const domain = {
  name: NAME,
  version: VERSION
};

const buildValue = (email: string, address: string, action: string): Subscription => {
  return {
    email,
    address: getAddress(address),
    action
  };
};

const signer = new Wallet(process.env.WALLET_PRIVATE_KEY as string);

export const sign = async (email: string, address: string, action: string): Promise<string> => {
  return await signer._signTypedData(domain, SubscriptionTypes, buildValue(email, address, action));
};

export const verify = (
  email: string,
  address: string,
  action: string,
  signature: string
): boolean => {
  const messageSigner = verifyTypedData(
    domain,
    SubscriptionTypes,
    buildValue(email, address, action),
    signature
  );

  return messageSigner === signer.address;
};
