import { NewSubscriber } from '../../src/schema';
import { randomTimestamp } from '../utils';

const email = 'test-verify@test.com';
const address = '0x21183c61EF17dB52827F9aB7ADda9ea759AF7DF8';
const verifiedAddress = '0xa0Ee7A142d267C1f36714E4a8F75612F20a79720';
const addressForNotExistEmail = '0xeF91cf65Ed49804B4b54f4cB9af6aC793f1CC32c';
const timestamp = randomTimestamp();
const timestampForVerifiedAddress = randomTimestamp();
const timestampForSecondVerifiedUser = randomTimestamp();
const subs: string[] = [];

export const verifyPayload = {
  unverifiedUser: { email, address },
  verifiedUser: {
    email: 'test-verify-c@test.com',
    address: verifiedAddress
  },
  secondVerifiedUserSameAddress: {
    email: 'test-verify-e@test.com',
    address: verifiedAddress
  },
  unverifiedUserForVerifiedAddress: {
    email: 'test-verify-b@test.com',
    address: verifiedAddress,
    timestamp: timestampForVerifiedAddress
  },
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
    created: timestampForVerifiedAddress,
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
  },
  {
    created: timestampForSecondVerifiedUser,
    email: verifyPayload.secondVerifiedUserSameAddress.email,
    address: verifyPayload.secondVerifiedUserSameAddress.address,
    subscriptions: subs,
    verified: 1
  }
];
