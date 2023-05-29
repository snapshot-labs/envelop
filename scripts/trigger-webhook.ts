import 'dotenv/config';
import { Job } from 'bull';
import proposalFactory from '../src/queues/processors/proposalFactory';

async function main() {
  if (process.argv.length < 3) {
    console.error(`Usage: yarn ts-node scripts/trigger-webhook.ts [EVENT] [ID]`);
    return process.exit(1);
  }
  const [, , event, id] = process.argv;

  const count = await proposalFactory({
    name: 'proposalFactory',
    data: { event: event.replace('proposal/', ''), id: id.replace('proposal/', '') }
  } as Job);

  console.log(`Queued ${count} email jobs`);
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
