import { Job } from 'bull';
import { Message } from '../../../types';
import { send } from '../../helpers/mail';
import templates from '../../templates';

export default async (job: Job) => {
  const { email, address, salt } = job.data;
  const msg = await templates.verification.prepare({
    to: email,
    address,
    salt
  });

  return await send(msg as Message);
};
