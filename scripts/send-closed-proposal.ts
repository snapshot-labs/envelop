import 'dotenv/config';
import { Job } from 'bull';
import closedProposal from '../src/queues/processors/closedProposal';
import { SKIPPED } from '../src/queues/utils';

async function main() {
  if (process.argv.length < 3) {
    console.error(
      `Usage: yarn ts-node scripts/send-closed-proposal.ts [EMAIL] [PROPOSAL-ID]`
    );
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
    const result = await main();

    if (result === SKIPPED) {
      console.error('Proposal was skipped, no email sent');
      return process.exit(1);
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
