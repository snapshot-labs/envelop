import 'dotenv/config';
import { Job } from 'bull';
import newProposal from '../src/queues/processors/newProposal';

async function main() {
  if (process.argv.length < 3) {
    console.error(`Usage: yarn node-ts send-new-proposal.ts [EMAIL] [PROPOSAL-ID]`);
    return process.exit(1);
  }
  const [, , email, id] = process.argv;

  return await newProposal({
    name: 'newProposal',
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
