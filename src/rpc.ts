import express from 'express';
import { subscribe, rpcError, rpcSuccess } from './helpers/utils';
import { send } from './helpers/mail';
import prepare from './templates/subscribe';

const router = express.Router();

router.post('/', async (req, res) => {
  const { id, method, params } = req.body;

  try {
    if (method === 'snapshot.subscribe') {
      await subscribe(params.email, params.address);

      await send(await prepare({ to: params.email, address: params.address }));

      return rpcSuccess(res, 'OK', id);
    }
  } catch (e) {
    console.log(e);
    return rpcError(res, 500, e, id);
  }
});

export default router;
