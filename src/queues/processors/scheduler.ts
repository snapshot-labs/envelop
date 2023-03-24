import { getUniqueEmails } from '../../helpers/utils';
import { mailerQueue } from '../queueProcessor';

export default async (): Promise<number> => {
  const emails = await getUniqueEmails();

  mailerQueue.addBulk(emails.map(email => ({ name: 'summary', data: email })));

  return Promise.resolve(emails.length);
};