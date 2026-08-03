import { randomTimestamp } from '../utils';
import type { NewSubscriber } from '../../src/schema';

const email = 'test-subscriber@test.com';
const address = '0xDBDd4c5473692Fa0490bfF6AAbf1181f29Ca851e';
const timestamp = randomTimestamp();

export const subscriberPayload = {
  unverifiedUserForDuplicateVerified: { email: `a${email}`, address },
  verifiedUser: { email, address },
  verifiedUserWithEmptySubscription: {
    email: `b${email}`,
    address: '0x54C8b17E5c46B97d25498205182e0382234B2532'
  },
  unverifiedUser: {
    email: `c${email}`,
    address: '0xc766c83C362E6D1Da8151F6aB588de7C79d03B8d'
  },
  timestamp
};

export const bootstrapData: NewSubscriber[] = [
  {
    created: timestamp,
    email: subscriberPayload.unverifiedUserForDuplicateVerified.email,
    address: subscriberPayload.unverifiedUserForDuplicateVerified.address,
    subscriptions: ['summary'],
    verified: 0
  },
  {
    created: timestamp,
    email: subscriberPayload.verifiedUser.email,
    address: subscriberPayload.verifiedUser.address,
    subscriptions: ['summary'],
    verified: timestamp
  },
  {
    created: timestamp,
    email: subscriberPayload.verifiedUserWithEmptySubscription.email,
    address: subscriberPayload.verifiedUserWithEmptySubscription.address,
    subscriptions: null,
    verified: timestamp
  },
  {
    created: timestamp,
    email: subscriberPayload.unverifiedUser.email,
    address: subscriberPayload.unverifiedUser.address,
    subscriptions: null,
    verified: 0
  }
];
