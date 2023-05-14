import { getUniqueEmails } from '../../helpers/utils';
import { previousWeek } from '../../helpers/date';
import { mailerQueue } from '../index';
import constants from '../../helpers/constants.json';

export default async () => {
  const results = await getUniqueEmails();
  const summaryTimeRange = previousWeek(new Date(), constants.summary.timezone);

  await mailerQueue.addBulk(
    results.map(result => ({
      name: 'summary',

      data: {
        email: result.email,
        startTimestamp: +summaryTimeRange.start,
        endTimestamp: +summaryTimeRange.end
      }
    }))
  );

  return results.length;
};
