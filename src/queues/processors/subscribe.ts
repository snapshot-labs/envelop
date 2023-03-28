import { send } from '../../helpers/mail';
import templates from '../../templates';

export default async (job): Promise<any> => {
  const { email, address } = job.data;
  const msg = await templates.subscribe.prepare({
    to: email,
    address
  });

  return Promise.resolve(await send(msg));
};
