import { send } from '../../helpers/mail';
import templates from '../../templates';
import type { Job } from 'pg-boss';
import type { Message } from '../../../types';

export default async (job: Job<any>) => {
  const { email, address, salt } = job.data;
  const msg = await templates.verification.prepare({
    to: email,
    address,
    salt
  });

  return await send(msg as Message);
};
