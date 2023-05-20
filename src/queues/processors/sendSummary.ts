import { getEmailAddresses } from '../../helpers/utils';
import { send } from '../../helpers/mail';
import templates from '../../templates';
import type { Job } from 'bullmq';
import type { Message } from '../../../types';

export default async (job: Job) => {
  const { email, startTimestamp, endTimestamp } = job.data;
  const msg = await templates.summary.prepare({
    to: email,
    addresses: (await getEmailAddresses(email)).map(data => data.address),
    startDate: new Date(startTimestamp),
    endDate: new Date(endTimestamp)
  });

  if (Object.keys(msg).length === 0) {
    return Promise.resolve('Skipped');
  }

  return await send(msg as Message);
};
