import { randomTimestamp } from '../utils';

const timestamp = randomTimestamp().toString();
const email = 'test-update@test.com';
const address = '0x123D816BF0b002bEA83a804e5cf1d2797Fcfc77d';

export const updatePayload = {
  email,
  address,
  timestamp
};

export const bootstrapData = [
  [timestamp, email, address, JSON.stringify(['summary']), timestamp],
  [timestamp, 'unverified@test.com', address, JSON.stringify(['summary']), 0],
  [
    timestamp,
    email,
    '0xA57Dc1C30536B26A24d6804EBA33A586439652F2',
    JSON.stringify(['summary']),
    timestamp
  ],
  [timestamp, email, '0xc2E7Ba8b2D297CE5c227B79D82AD1c11B5596307', JSON.stringify(['summary']), 0]
];
