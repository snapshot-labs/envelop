import 'dotenv/config';
import { Job } from 'bull';
import closedProposal from '../src/queues/processors/closedProposal';

async function main() {
  if (process.argv.length < 3) {
    console.error(`Usage: yarn node-ts send-closed-proposal.ts [EMAIL] [PROPOSAL-ID]`);
    return process.exit(1);
  }
  const [, , email, id] = process.argv;

  return await closedProposal({
    name: 'closedProposal',
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
