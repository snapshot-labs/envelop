import { getUniqueEmails } from '../../helpers/utils';
import { mailerQueue } from '../index';

export default async (): Promise<number> => {
  const results = await getUniqueEmails();

  mailerQueue.addBulk(
    results.map(result => ({
      name: 'summary',
      data: { email: result.email, endTimestamp: +new Date() }
    }))
  );

  return results.length;
};
