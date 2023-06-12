import 'dotenv/config';
import { Job } from 'bull';
import verify from '../src/queues/processors/verify';

async function main() {
  if (process.argv.length < 3) {
    console.error(`Usage: yarn ts-node scripts/send-verify.ts [EMAIL] [ADDRESS] [SALT]`);
    return process.exit(1);
  }
  const [, , email, address, salt] = process.argv;

  return await verify({
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
