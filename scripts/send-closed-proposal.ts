import 'dotenv/config';
import { Job } from 'bullmq';
import sendClosedProposal from '../src/queues/processors/sendClosedProposal';

async function main() {
  if (process.argv.length < 3) {
    console.error(`Usage: yarn ts-node scripts/send-closed-proposal.ts [EMAIL] [PROPOSAL-ID]`);
    return process.exit(1);
  }
  const [, , email, id] = process.argv;

  return await sendClosedProposal({
    name: 'send-closedProposal',
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
