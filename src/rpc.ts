import express from 'express';
import { subscribe, rpcError, rpcSuccess } from './helpers/utils';
import { send } from './helpers/mail';
import constants from './helpers/constants.json';

const router = express.Router();

router.post('/', async (req, res) => {
  const { id, method, params } = req.body;

  try {
    if (method === 'snapshot.subscribe') {
      await subscribe(params.email, params.address);

      await send('subscribe', {
        to: params.email,
        address: params.address,
        name: constants.example.name
      });

      return rpcSuccess(res, 'OK', id);
    }
  } catch (e) {
    console.log(e);
    return rpcError(res, 500, e, id);
  }
});

export default router;
