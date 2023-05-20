import 'dotenv/config';
import { Job } from 'bullmq';
import createProposalActivities from '../src/queues/processors/createProposalActivities';

async function main() {
  if (process.argv.length < 3) {
    console.error(`Usage: yarn ts-node scripts/trigger-webhook.ts [EVENT] [ID]`);
    return process.exit(1);
  }
  const [, , event, id] = process.argv;

  const count = await createProposalActivities({
    name: 'create-proposal-activities',
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
