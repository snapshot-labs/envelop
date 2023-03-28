import { getEmailAddresses } from '../../helpers/utils';
import { send } from '../../helpers/mail';
import templates from '../../templates';

export default async (job): Promise<any> => {
  const { email } = job.data;
  const msg = await templates.summary.prepare({
    to: email,
    addresses: (await getEmailAddresses(email)).map(data => data.address)
  });

  if (Object.keys(msg).length === 0) {
    return Promise.resolve('Skipped');
  }

  return Promise.resolve(await send(msg));
};
