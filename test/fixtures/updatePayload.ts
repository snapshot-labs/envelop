import { randomTimestamp } from '../utils';
import type { NewSubscriber } from '../../src/schema';

const timestamp = randomTimestamp();
const email = 'test-update@test.com';
const address = '0x123D816BF0b002bEA83a804e5cf1d2797Fcfc77d';

export const updatePayload = {
  email,
  address,
  timestamp
};

export const bootstrapData: NewSubscriber[] = [
  { created: timestamp, email, address, subscriptions: ['summary'], verified: timestamp },
  {
    created: timestamp,
    email: 'unverified@test.com',
    address,
    subscriptions: ['summary'],
    verified: 0
  },
  {
    created: timestamp,
    email,
    address: '0xA57Dc1C30536B26A24d6804EBA33A586439652F2',
    subscriptions: ['summary'],
    verified: timestamp
  },
  {
    created: timestamp,
    email,
    address: '0xc2E7Ba8b2D297CE5c227B79D82AD1c11B5596307',
    subscriptions: ['summary'],
    verified: 0
  }
];
