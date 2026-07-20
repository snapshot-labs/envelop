import { randomTimestamp } from '../utils';
import type { NewSubscriber } from '../../src/schema';

const email = 'test-verify@test.com';
const address = '0xDBDd4c5473692Fa0490bfF6AAbf1181f29Ca851e';
const verifiedAddress = '0x54C8b17E5c46B97d25498205182e0382234B2532';
const addressForNotExistEmail = '0xeF91cf65Ed49804B4b54f4cB9af6aC793f1CC32c';
const timestamp = randomTimestamp();
const subs: string[] = [];

export const verifyPayload = {
  unverifiedUser: { email, address },
  verifiedUser: {
    email: 'test-verify-c@test.com',
    address: verifiedAddress
  },
  unverifiedUserForVerifiedAddress: { email: 'test-verify-b@test.com', address: verifiedAddress },
  addressForNotExistEmail,
  timestamp
};

export const bootstrapData: NewSubscriber[] = [
  {
    created: timestamp,
    email: verifyPayload.unverifiedUser.email,
    address: verifyPayload.unverifiedUser.address,
    subscriptions: subs,
    verified: 0
  },
  {
    created: timestamp,
    email: verifyPayload.unverifiedUserForVerifiedAddress.email,
    address: verifyPayload.unverifiedUserForVerifiedAddress.address,
    subscriptions: subs,
    verified: 0
  },
  {
    created: timestamp,
    email: verifyPayload.verifiedUser.email,
    address: verifyPayload.verifiedUser.address,
    subscriptions: subs,
    verified: 1
  }
];
