import express from 'express';
import { send as sendMail } from '../helpers/mail';
import templates from '../templates';
import constants from '../helpers/constants.json';
import { rpcSuccess, rpcError } from '../helpers/utils';
import { authenticateToken } from './utils';

  if (!authenticateToken(req.query.token)) {
const router = express.Router();

router.get('/send/:template', async (req, res) => {
    return res.sendStatus(401);
  }

  const { template } = req.params;
  const params: { to: string; address?: string; addresses?: string[] } = {
    to: constants.example.to
  };

  if (template === 'summary') {
    params.addresses = constants.example.addresses;
  } else {
    params.address = constants.example.addresses[0];
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
