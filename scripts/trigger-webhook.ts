import 'dotenv/config';
import { Job } from 'bull';
import proposalFactory from '../src/queues/processors/proposalFactory';
import { FAN_OUT_SCHEDULED } from '../src/queues/utils';

async function main() {
  if (process.argv.length < 3) {
    console.error(
      `Usage: yarn ts-node scripts/trigger-webhook.ts [EVENT] [ID]`
    );
    return process.exit(1);
  }
  const [, , event, id] = process.argv;

  const count = await proposalFactory({
    name: 'proposalFactory',
    data: {
      event: event.replace('proposal/', ''),
      id: id.replace('proposal/', '')
    }
  } as Job);

  if (count === FAN_OUT_SCHEDULED) {
    console.log(
      'Fan-out scheduled, recipients are resolved when the mail is due'
    );
    return;
  }

  console.log(`Queued ${count} email jobs`);
}

(async () => {
  try {
    await main();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
