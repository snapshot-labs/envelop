import express from 'express';
import { isAddress } from '@ethersproject/address';
import {
  subscribe,
  verify,
  unsubscribe,
  rpcError,
  rpcSuccess,
  isValidEmail
} from './helpers/utils';
import { verifySubscribe, verifyUnsubscribe } from './sign';
import { queueSubscribe, queueProposalActivity } from './queues';
import { version, name } from '../package.json';

const router = express.Router();

router.get('/', (req, res) => {
  const commit = process.env.COMMIT_HASH || '';
  const v = commit ? `${version}#${commit.substr(0, 7)}` : version;
  return res.json({
    name,
    version: v
  });
});

router.post('/', async (req, res) => {
  const { id, method, params } = req.body;

  try {
    if (method === 'snapshot.subscribe') {
      if (!isValidEmail(params.email) || !isAddress(params.address)) {
        return rpcError(res, 400, 'Invalid params', id);
      }

      await subscribe(params.email, params.address);
      queueSubscribe(params.email, params.address);

      return rpcSuccess(res, 'OK', id);
    } else if (method === 'snapshot.verify') {
      if (verifySubscribe(params.email, params.address, params.signature)) {
        await verify(params.email, params.address);
        return rpcSuccess(res, 'OK', id);
      }

      return rpcError(res, 500, 'Unable to authenticate your verification link', id);
    } else if (method === 'snapshot.unsubscribe') {
      if (verifyUnsubscribe(params.email, params.signature)) {
        await unsubscribe(params.email);
        return rpcSuccess(res, 'OK', id);
      }

      return rpcError(res, 500, 'Unable to authenticate your verification link', id);
    }
  } catch (e) {
    console.log(e);
    return rpcError(res, 500, e, id);
  }
});

router.post('/webhook', async (req, res) => {
  const body = req.body || {};
  const event = body.event.toString();
  const id = body.id.toString().replace('proposal/', '');

  if (req.headers['authenticate'] !== process.env.WEBHOOK_AUTH_TOKEN?.toString()) {
    return rpcError(res, 401, 'Unauthorized', id);
  }

  if (!event || !id) {
    return rpcError(res, 400, 'Invalid Request', id);
  }

  if (!['proposal/end', 'proposal/created'].includes(event)) {
    return rpcSuccess(res, 'Event skipped', id);
  }

  try {
    queueProposalActivity(event.replace('proposal/', ''), id);
    return rpcSuccess(res, 'OK', id);
  } catch (e) {
    return rpcError(res, 500, 'Internal error', id);
  }
});

export default router;
