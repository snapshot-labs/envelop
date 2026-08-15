import { Job } from 'bull';
import { Message } from '../../../types';
import { send } from '../../helpers/mail';
import templates from '../../templates';
import { SKIPPED } from '../utils';

export default async (job: Job): Promise<any> => {
  const { email, id } = job.data;
  const msg = await templates.closedProposal.prepare({
    to: email,
    id
  });

  if (Object.keys(msg).length === 0) {
    return Promise.resolve(SKIPPED);
  }

  return send(msg as Message);
};
