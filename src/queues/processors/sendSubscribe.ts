import { send } from '../../helpers/mail';
import templates from '../../templates';
import type { Job } from 'bullmq';
import type { Message } from '../../../types';

export default async (job: Job) => {
  const { email, address } = job.data;
  const msg = await templates.subscribe.prepare({
    to: email,
    address
  });

  return await send(msg as Message);
};
