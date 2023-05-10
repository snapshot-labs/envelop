import 'dotenv/config';
import { Job } from 'bull';
import subscribe from '../src/queues/processors/subscribe';

async function main() {
  if (process.argv.length < 3) {
    console.error(`Usage: yarn node-ts send-subscribe.ts [EMAIL] [ADDRESS]`);
    return process.exit(1);
  }
  const [, , email, address] = process.argv;

  return await subscribe({
    name: '',
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
