import express from 'express';
import { buildMessage, sha256 } from './utils';
import { TemplateId } from '../../types';
import { send as sendMail } from '../helpers/mail';
import { rpcError, rpcSuccess } from '../helpers/utils';
import { queueScheduler } from '../queues';

const router = express.Router();
const AUTH_TOKEN_HASH =
  'cd372fb85148700fa88095e3492d3f9f5beb43e555e5ff26d95f5a6adc36f8e6';

router.get('/send/:template', async (req, res) => {
  const templateId = req.params.template as TemplateId;

  if (sha256(req.query.token as string) !== AUTH_TOKEN_HASH) {
    return rpcError(res, 'UNAUTHORIZED', templateId);
  }

  if (templateId === 'summary') {
    queueScheduler();
    return rpcSuccess(res, 'OK', templateId);
  }

  let msg;
  try {
    msg = await buildMessage(
      templateId,
      req.query.to ? { to: req.query.to as string } : {}
    );
  } catch (err: any) {
    return rpcError(res, err, templateId);
  }

  if (Object.keys(msg).length === 0) {
    return rpcSuccess(res, '204', templateId);
  }

  try {
    await sendMail(msg);
    return rpcSuccess(res, 'OK', templateId);
  } catch (err: any) {
    return rpcError(res, err, templateId);
  }
});

export default router;
