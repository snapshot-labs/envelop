import express from 'express';
import { subscribe, verify, unsubscribe, rpcError, rpcSuccess } from './helpers/utils';
import { sign as getSignature, verify as verifySignature } from './sign';
import { send } from './helpers/mail';
import templates from './templates';

const router = express.Router();

router.post('/', async (req, res) => {
  const { id, method, params } = req.body;

  try {
    if (method === 'snapshot.subscribe') {
      await subscribe(params.email, params.address);

      await send(
        await templates.subscribe.prepare({
          to: params.email,
          address: params.address,
          signature: getSignature(params.email, params.address, 'subscribe')
        })
      );

      return rpcSuccess(res, 'OK', id);
    } else if (method === 'snapshot.verify') {
      if (verifySignature(params.email, params.address, params.signature, 'subscribe')) {
        await verify(params.email, params.address);
        return rpcSuccess(res, 'OK', id);
      }

      return rpcError(res, 500, 'Unable to authenticate your verification link', id);
    } else if (method === 'snapshot.unsubscribe') {
      if (verifySignature(params.email, params.address, params.signature)) {
        await unsubscribe(params.email, params.address);
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
