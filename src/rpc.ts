import express from 'express';
import { isAddress } from '@ethersproject/address';
import {
  subscribe,
  verify,
  unsubscribe,
  update,
  rpcError,
  rpcSuccess,
  isValidEmail,
  getAddressSubscriptions
} from './helpers/utils';
import { verifySubscribe, verifyUnsubscribe, verifyUpdate } from './sign';
import { queueSubscribe } from './queues';
import { version, name } from '../package.json';
import { SUBSCRIPTIONS_TYPE, default as templates } from './templates';

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
        await unsubscribe(params.email, params.subscriptions);
        return rpcSuccess(res, 'OK', id);
      }

      return rpcError(res, 500, 'Unable to authenticate your verification link', id);
    } else if (method === 'snapshot.update') {
      if (!Array.isArray(params.subscriptions)) {
        return rpcError(res, 400, 'Invalid params', id);
      }

      if (verifyUpdate(params.email, params.address, params.subscriptions, params.signature)) {
        await update(params.email, params.address, params.subscriptions);
        return rpcSuccess(res, 'OK', id);
      }

      return rpcError(res, 500, 'Unable to authenticate your request', id);
    }
  } catch (e) {
    console.log(e);
    return rpcError(res, 500, e, id);
  }
});

router.post('/subscriber', async (req, res) => {
  const { address } = req.body;

  try {
    const subscribers = await getAddressSubscriptions(address);
    if (!subscribers || !subscribers[0]) {
      return rpcError(res, 404, 'Address not found', address);
    }

    return res.json(JSON.parse(subscribers[0].subscriptions as string));
  } catch (e) {
    console.log(e);
    return rpcError(res, 500, e, address);
  }
});

router.get('/subscriptionsList', (req, res) => {
  return res.json(
    Object.fromEntries(
      SUBSCRIPTIONS_TYPE.map(k => [
        k,
        { name: templates[k].name, description: templates[k].description }
      ])
    )
  );
});

export default router;
