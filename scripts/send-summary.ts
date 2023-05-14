import 'dotenv/config';
import { Job } from 'bull';
import summary from '../src/queues/processors/summary';
import { previousWeek } from '../src/helpers/date';
import constants from '../src/helpers/constants.json';

async function main() {
  if (process.argv.length < 3) {
    console.error(`Usage: yarn ts-node scripts/send-summary.ts [EMAIL] [SEND_DATE]`);
    return process.exit(1);
  }
  const [, , email, sendDate] = process.argv;
  const summaryTimeRange = previousWeek(new Date(Date.parse(sendDate)), constants.summary.timezone);

  return await summary({
    name: '',
    data: { email, startTimestamp: +summaryTimeRange.start, endTimestamp: +summaryTimeRange.end }
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
