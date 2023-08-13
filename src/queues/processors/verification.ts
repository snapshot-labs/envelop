import type { Job } from 'bull';
import { send } from '../../helpers/mail';
import templates from '../../templates';
import type { Message } from '../../../types';

export default async (job: Job) => {
  const { email, address, salt } = job.data;
  const msg = await templates.verification.prepare({
    to: email,
    address,
    salt
  });

  return await send(msg as Message);
};
