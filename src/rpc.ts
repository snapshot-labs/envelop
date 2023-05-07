import express from 'express';
import {
  subscribe,
  verify,
  unsubscribe,
  rpcError,
  rpcSuccess,
  isValidEmail,
  isValidAddress
} from './helpers/utils';
import { verifySubscribe, verifyUnsubscribe } from './sign';
import { queueSubscribe } from './queues';

const router = express.Router();

router.post('/', async (req, res) => {
  const { id, method, params } = req.body;

  try {
    if (method === 'snapshot.subscribe') {
      if (!isValidEmail(params.email) || !isValidAddress(params.address) || !params.signature) {
        return rpcError(res, 400, 'Invalid params', id);
      }

      if (verifySubscribe(params.email, params.address, params.signature, params.address)) {
        await subscribe(params.email, params.address);
        queueSubscribe(params.email, params.address);
        return rpcSuccess(res, 'OK', id);
      }

      return rpcError(res, 500, 'Unable to authenticate the request', id);
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

export default router;
