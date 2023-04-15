import express from 'express';
import { send as sendMail } from '../helpers/mail';
import { rpcSuccess, rpcError } from '../helpers/utils';
import { sha256, buildMessage } from './utils';
import type { TemplateId } from '../../types';

const router = express.Router();
const AUTH_TOKEN_HASH = 'cd372fb85148700fa88095e3492d3f9f5beb43e555e5ff26d95f5a6adc36f8e6';

router.get('/send/:template', async (req, res) => {
  const templateId = req.params.template as TemplateId;

  if (sha256(req.query.token as string) !== AUTH_TOKEN_HASH) {
    return res.sendStatus(401);
  }

  let msg;
  try {
    msg = await buildMessage(templateId, req.query.to ? { to: req.query.to } : {});
  } catch (e) {
    return res.sendStatus(404);
  }

  try {
    await sendMail(msg);
    return rpcSuccess(res, 'OK', templateId);
  } catch (e) {
    return rpcError(res, 500, e, templateId);
  }
});

export default router;
