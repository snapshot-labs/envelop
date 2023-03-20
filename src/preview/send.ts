import { send as sendMail } from '../helpers/mail';
import templates from '../templates';
import constants from '../helpers/constants.json';
import { rpcSuccess, rpcError } from '../helpers/utils';

export default async function send(req, res) {
  const params = {
    to: constants.example.to,
    address: [constants.example.address]
  };
  const { template } = req.params;
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
