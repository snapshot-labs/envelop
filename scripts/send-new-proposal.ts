import 'dotenv/config';
import { Job } from 'bull';
import newProposal from '../src/queues/processors/newProposal';
import { SKIPPED } from '../src/queues/utils';

async function main() {
  if (process.argv.length < 3) {
    console.error(
      `Usage: yarn ts-node scripts/send-new-proposal.ts [EMAIL] [PROPOSAL-ID]`
    );
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
