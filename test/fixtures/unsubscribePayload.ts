import { Wallet } from '@ethersproject/wallet';
import { randomTimestamp } from '../utils';

const privateKey = '0a5b35deb46ca896e63fcbfbce3b7fd40991b37bb313e8f9e713e9a04317053a';
const wallet = new Wallet(privateKey);

export const unsubscribePayload = {
  email: 'test-unsubscribe@test.com',
  address: wallet.address,
  wallet,
  timestamp: randomTimestamp().toString()
};
