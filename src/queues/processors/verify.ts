import { send } from '../../helpers/mail';
import templates from '../../templates';
import type { Job } from 'bull';
import type { Message } from '../../../types';

export default async (job: Job) => {
  const { email, address, salt } = job.data;
  const msg = await templates.verify.prepare({
    to: email,
    address,
    salt
  });

  return await send(msg as Message);
};
