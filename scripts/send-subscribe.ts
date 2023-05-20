import 'dotenv/config';
import { Job } from 'bullmq';
import sendSubscribe from '../src/queues/processors/sendSubscribe';

async function main() {
  if (process.argv.length < 3) {
    console.error(`Usage: yarn ts-node scripts/send-subscribe.ts [EMAIL] [ADDRESS]`);
    return process.exit(1);
  }
  const [, , email, address] = process.argv;

  return await sendSubscribe({
    name: 'send-subscribe',
    data: { email, address }
  } as Job);
}

(async () => {
  try {
    await main();
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
