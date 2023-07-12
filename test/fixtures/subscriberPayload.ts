import { randomTimestamp } from '../utils';

const email = 'test-subscriber@test.com';
const address = '0xDBDd4c5473692Fa0490bfF6AAbf1181f29Ca851e';
const timestamp = randomTimestamp().toString();

export const subscriberPayload = {
  unverifiedUserForDuplicateVerified: { email: `a${email}`, address },
  verifiedUser: { email, address },
  verifiedUserWithEmptySubscription: {
    email: `b${email}`,
    address: '0x54C8b17E5c46B97d25498205182e0382234B2532'
  },
  unverifiedUser: { email: `c${email}`, address: '0xc766c83C362E6D1Da8151F6aB588de7C79d03B8d' },
  timestamp
};

export const bootstrapData = [
  [
    timestamp,
    subscriberPayload.unverifiedUserForDuplicateVerified.email,
    subscriberPayload.unverifiedUserForDuplicateVerified.address,
    JSON.stringify(['summary']),
    0
  ],
  [
    timestamp,
    subscriberPayload.verifiedUser.email,
    subscriberPayload.verifiedUser.address,
    JSON.stringify(['summary']),
    timestamp
  ],
  [
    timestamp,
    subscriberPayload.verifiedUserWithEmptySubscription.email,
    subscriberPayload.verifiedUserWithEmptySubscription.address,
    null,
    timestamp
  ],
  [
    timestamp,
    subscriberPayload.unverifiedUser.email,
    subscriberPayload.unverifiedUser.address,
    null,
    0
  ]
];
