import { send } from '../../helpers/mail';
import templates from '../../templates';
import type { Job } from 'pg-boss';
import type { Message } from '../../../types';

export default async (job: Job<any>): Promise<any> => {
  const { email, id } = job.data;
  const msg = await templates.closedProposal.prepare({
    to: email,
    id
  });

  return send(msg as Message);
};
