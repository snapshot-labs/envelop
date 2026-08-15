import 'dotenv/config';
import { Job } from 'bull';
import constants from '../src/helpers/constants.json';
import { previousWeek } from '../src/helpers/date';
import summary from '../src/queues/processors/summary';
import { SKIPPED } from '../src/queues/utils';

async function main() {
  if (process.argv.length < 3) {
    console.error(
      `Usage: yarn ts-node scripts/send-summary.ts [EMAIL] [ADDRESSES] [SEND_DATE]`
    );
    return process.exit(1);
  }
  const [, , email, addresses, sendDate] = process.argv;
  const summaryTimeRange = previousWeek(
    new Date(Date.parse(sendDate)),
    constants.summary.timezone
  );

  return await summary({
    name: '',
    data: {
      email,
      addresses,
      startTimestamp: +summaryTimeRange.start,
      endTimestamp: +summaryTimeRange.end
    }
  } as Job);
}

(async () => {
  try {
    const result = await main();

    // Unlike the proposal mails, an empty summary is the ordinary "nothing
    // happened this week" outcome rather than a fault, so it still exits 0.
    if (result === SKIPPED) {
      console.log('No proposals in the period, no email sent');
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
