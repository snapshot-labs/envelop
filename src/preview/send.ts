import express from 'express';
import { send as sendMail } from '../helpers/mail';
import templates from '../templates';
import constants from '../helpers/constants.json';
import { rpcSuccess, rpcError } from '../helpers/utils';
import { sha256 } from './utils';
import { subscribe as getSignature } from '../sign';

const router = express.Router();
const AUTH_TOKEN_HASH = 'cd372fb85148700fa88095e3492d3f9f5beb43e555e5ff26d95f5a6adc36f8e6';

router.get('/send/:template', async (req, res) => {
  if (sha256(req.query.token as string) !== AUTH_TOKEN_HASH) {
    return res.sendStatus(401);
  }

  const { template } = req.params;
  const params: { to: string; address?: string; addresses?: string[]; signature?: string } = {
    to: constants.example.to
  };

  if (template === 'summary') {
    params.addresses = constants.example.addresses;
  } else {
    params.address = constants.example.addresses[0];
    params.signature = await getSignature(constants.example.to, constants.example.addresses[0]);
  }
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
});

export default router;
