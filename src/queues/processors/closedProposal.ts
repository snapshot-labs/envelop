import { send } from '../../helpers/mail';
import templates from '../../templates';
import type { Job } from 'bull';
import type { Message } from '../../../types';

export default async (job: Job): Promise<any> => {
  const { email, proposalId } = job.data;
  const msg = await templates.closedProposal.prepare({
    to: email,
    id: proposalId
  });

  return await send(msg as Message);
};
