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
import { verifySubscribe, verifyUnsubscribe, verifyVerify } from './sign';
import { queueSubscribe } from './queues';
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
      if (!isValidEmail(params.email) || !isAddress(params.address) || !params.signature) {
        return rpcError(res, 400, 'Invalid params', id);
      }

      if (verifySubscribe(params.email, params.address, params.signature)) {
        await subscribe(params.email, params.address);
        queueSubscribe(params.email, params.address);
        return rpcSuccess(res, 'OK', id);
      }

      return rpcError(res, 500, 'Unable to authenticate the request', id);
    } else if (method === 'snapshot.verify') {
      if (verifyVerify(params.email, params.address, params.signature)) {
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

export default router;
