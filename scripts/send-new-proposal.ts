import 'dotenv/config';
import { Job } from 'bullmq';
import sendNewProposal from '../src/queues/processors/sendNewProposal';

async function main() {
  if (process.argv.length < 3) {
    console.error(`Usage: yarn ts-node scripts/send-new-proposal.ts [EMAIL] [PROPOSAL-ID]`);
    return process.exit(1);
  }
  const [, , email, id] = process.argv;

  return await sendNewProposal({
    name: 'send-newProposal',
    data: { email, id }
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
