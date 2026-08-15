import { Job } from 'bull';
import { Message } from '../../../types';
import { send } from '../../helpers/mail';
import templates from '../../templates';
import { SKIPPED } from '../utils';

export default async (job: Job) => {
  const { email, addresses, startTimestamp, endTimestamp } = job.data;
  const msg = await templates.summary.prepare({
    to: email,
    addresses: addresses.split(','),
    startDate: new Date(startTimestamp),
    endDate: new Date(endTimestamp)
  });

  if (Object.keys(msg).length === 0) {
    return Promise.resolve(SKIPPED);
  }

  return await send(msg as Message);
};
