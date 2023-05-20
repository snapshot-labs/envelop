import { send } from '../../helpers/mail';
import templates from '../../templates';
import type { Job } from 'bullmq';
import type { Message } from '../../../types';

export default async (job: Job): Promise<any> => {
  const { email, id } = job.data;
  const msg = await templates.closedProposal.prepare({
    to: email,
    id
  });

  return await send(msg as Message);
};
