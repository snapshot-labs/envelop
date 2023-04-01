import express from 'express';
import { send as sendMail } from '../helpers/mail';
import { rpcSuccess, rpcError } from '../helpers/utils';
import { sha256, buildMessage } from './utils';
import { queueScheduler } from '../queues';

const router = express.Router();
const AUTH_TOKEN_HASH = 'cd372fb85148700fa88095e3492d3f9f5beb43e555e5ff26d95f5a6adc36f8e6';

router.get('/send/:template', async (req, res) => {
  const { template } = req.params;

  if (sha256(req.query.token as string) !== AUTH_TOKEN_HASH) {
    return rpcError(res, 401, 'Invalid security token', template);
  }

  if (template === 'all-summary') {
    queueScheduler();
    return rpcSuccess(res, 'OK', template);
  }

  let msg;
  try {
    msg = await buildMessage(template, req.query.to ? { to: req.query.to as string } : {});
  } catch (e) {
    return rpcError(res, 404, e, template);
  }

  if (Object.keys(msg).length === 0) {
    return rpcSuccess(res, 204, template);
  }

  try {
    await sendMail(msg);
    return rpcSuccess(res, 'OK', template);
  } catch (e) {
    return rpcError(res, 500, e, template);
  }
});

export default router;
