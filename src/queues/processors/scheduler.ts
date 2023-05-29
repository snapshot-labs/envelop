import { getUniqueEmails } from '../../helpers/utils';
import { previousWeek } from '../../helpers/date';
import { mailerQueue } from '../index';
import constants from '../../helpers/constants.json';

export default async (): Promise<number> => {
  const results = await getUniqueEmails('summary');
  const summaryTimeRange = previousWeek(new Date(), constants.summary.timezone);

  await mailerQueue.addBulk(
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
