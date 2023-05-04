import { getEmailAddresses } from '../../helpers/utils';
import { send } from '../../helpers/mail';
import templates from '../../templates';
import type { Job } from 'bull';
import type { Message } from '../../../types';

export default async (job: Job): Promise<any> => {
  const { email, endTimestamp } = job.data;
  const msg = await templates.summary.prepare({
    to: email,
    addresses: (await getEmailAddresses(email)).map(data => data.address),
    endDate: new Date(endTimestamp)
  });

  if (Object.keys(msg).length === 0) {
    return Promise.resolve('Skipped');
  }

  return Promise.resolve(await send(msg as Message));
};
