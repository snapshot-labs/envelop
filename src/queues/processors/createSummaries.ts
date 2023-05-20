import { getUniqueEmails } from '../../helpers/utils';
import { previousWeek } from '../../helpers/date';
import { sendSummaryQueue } from '../index';
import constants from '../../helpers/constants.json';

export default async () => {
  const results = await getUniqueEmails();
  const summaryTimeRange = previousWeek(new Date(), constants.summary.timezone);

  await sendSummaryQueue.addBulk(
    results.map(result => ({
      name: 'summary',
      data: {
        email: result.email,
        startTimestamp: +summaryTimeRange.start,
        endTimestamp: +summaryTimeRange.end
      },
      opts: {
        jobId: `summary-${result.email}-${+summaryTimeRange.start}`
      }
    }))
  );

  return results.length;
};
