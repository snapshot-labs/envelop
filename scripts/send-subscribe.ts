import 'dotenv/config';
import { Job } from 'bull';
import subscribe from '../src/queues/processors/subscribe';

async function main() {
  if (process.argv.length < 3) {
    console.error(`Usage: yarn ts-node scripts/send-subscribe.ts [EMAIL] [ADDRESS] [SALT]`);
    return process.exit(1);
  }
  const [, , email, address, salt] = process.argv;

  return await subscribe({
    name: '',
    data: { email, address, salt }
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
