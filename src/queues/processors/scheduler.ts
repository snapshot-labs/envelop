import { getUniqueEmails } from '../../helpers/utils';
import { mailerQueue } from '../index';

export default async (): Promise<number> => {
  const results = await getUniqueEmails();
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - 7);

  mailerQueue.addBulk(
    results.map(result => ({
      name: 'summary',
      data: { email: result.email, startTimestamp: +startDate, endTimestamp: +endDate }
    }))
  );

  return Promise.resolve(results.length);
};
