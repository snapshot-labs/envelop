import express from 'express';
import { send as sendMail } from '../helpers/mail';
import { rpcSuccess, rpcError } from '../helpers/utils';
import { sha256, buildMessage } from './utils';
import type { TemplateId } from '../../types';
import { queueScheduler } from '../queues';

const router = express.Router();
const AUTH_TOKEN_HASH = 'cd372fb85148700fa88095e3492d3f9f5beb43e555e5ff26d95f5a6adc36f8e6';

router.get('/send/:template', async (req, res) => {
  const templateId = req.params.template as TemplateId;

  if (sha256(req.query.token as string) !== AUTH_TOKEN_HASH) {
    return rpcError(res, 401, 'Invalid security token', templateId);
  }

  if (templateId === 'summary') {
    queueScheduler();
    return rpcSuccess(res, 'OK', templateId);
  }

  let msg;
  try {
    msg = await buildMessage(templateId, req.query.to ? { to: req.query.to } : {});
  } catch (e) {
    return rpcError(res, 404, e, templateId);
  }

  if (Object.keys(msg).length === 0) {
    return rpcSuccess(res, '204', templateId);
  }

  try {
    await sendMail(msg);
    return rpcSuccess(res, 'OK', templateId);
  } catch (e) {
    return rpcError(res, 500, e, templateId);
  }
});

export default router;
