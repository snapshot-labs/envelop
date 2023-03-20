import { send as sendMail } from '../helpers/mail';
import templates from '../templates';
import constants from '../helpers/constants.json';
import { rpcSuccess, rpcError } from '../helpers/utils';
import { subscribe, unsubscribe } from '../sign';

export default async function send(req, res) {
  const { template } = req.params;
  const params = {
    to: constants.example.to,
    address: [constants.example.address],
    signature:
      template === 'subscribe'
        ? await subscribe(constants.example.to, constants.example.address)
        : await unsubscribe(constants.example.to, constants.example.address)
  };
  let msg;

  if (templates[template]) {
    msg = await templates[template].prepare(params);
  } else {
    return res.sendStatus(404);
  }

  try {
    await sendMail(msg);
    return rpcSuccess(res, 'OK', template);
  } catch (e) {
    return rpcError(res, 500, e, template);
  }
}
