import { send as sendMail } from '../helpers/mail';
import templates from '../templates';
import constants from '../helpers/constants.json';

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

  res.send(await sendMail(msg));
}
