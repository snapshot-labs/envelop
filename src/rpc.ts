import { getAddress } from '@ethersproject/address';
import { capture } from '@snapshot-labs/snapshot-sentry';
import express from 'express';
import { name, version } from '../package.json';
import {
  getSubscriber,
  isValidEmail,
  NOT_SUBSCRIBED,
  rpcError,
  rpcSuccess,
  subscribe,
  unsubscribe,
  update,
  verify
} from './helpers/utils';
import { queueProposalActivity, queueVerify } from './queues';
import {
  verifySubscribe,
  verifyUnsubscribe,
  verifyUpdate,
  verifyVerify
} from './sign';
import { SUBSCRIPTION_TYPE, default as templates } from './templates';

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
    const address =
      params?.address && params.address.length > 0
        ? getAddress(params.address)
        : params?.address;

    if (method === 'snapshot.subscribe') {
      if (!isValidEmail(params.email)) {
        return rpcError(res, 'INVALID_PARAMS', id);
      }

      if (verifySubscribe(params.email, address, params.signature)) {
        const subscriber = await subscribe(params.email, address);
        if (subscriber) {
          queueVerify(
            subscriber.email,
            subscriber.address,
            subscriber.created.toString()
          );
        }
        return rpcSuccess(res, 'OK', id);
      }

      return rpcError(res, 'UNAUTHORIZED', id);
    } else if (method === 'snapshot.verify') {
      const salt = Number(params.salt);
      if (!Number.isSafeInteger(salt)) {
        return rpcError(res, 'INVALID_PARAMS', id);
      }

      if (verifyVerify(params.email, address, params.salt, params.signature)) {
        await verify(params.email, address, salt);
        return rpcSuccess(res, 'OK', id);
      }

      return rpcError(res, 'UNAUTHORIZED', id);
    } else if (method === 'snapshot.unsubscribe') {
      if (verifyUnsubscribe(params.email, address, params.signature)) {
        await unsubscribe(params.email, address);
        return rpcSuccess(res, 'OK', id);
      }

      return rpcError(res, 'UNAUTHORIZED', id);
    } else if (method === 'snapshot.update') {
      if (!Array.isArray(params.subscriptions)) {
        return rpcError(res, 'INVALID_PARAMS', id);
      }

      // Do not check `subscriptions` for requests coming from
      // envelop-ui, signed by backend
      const isValidSignature = verifyUpdate(
        params.email,
        address,
        address && address.length > 0 ? params.subscriptions : [],
        params.signature
      );

      if (isValidSignature) {
        await update(params.email, address, params.subscriptions);
        return rpcSuccess(res, 'OK', id);
      }

      return rpcError(res, 'UNAUTHORIZED', id);
    }
  } catch (err: any) {
    capture(err, { body: req.body });
    return rpcError(res, err, id);
  }
});

router.post('/webhook', async (req, res) => {
  const body = req.body || {};
  const event = body.event?.toString() ?? '';
  const id = body.id?.toString().replace('proposal/', '') ?? '';

  if (
    req.headers['authentication'] !== `${process.env.WEBHOOK_AUTH_TOKEN || ''}`
  ) {
    return rpcError(res, 'UNAUTHORIZED', id);
  }

  if (!event || !id) {
    return rpcError(res, 'INVALID_PARAMS', id);
  }

  if (!['proposal/end', 'proposal/created'].includes(event)) {
    return rpcSuccess(res, 'Event skipped', id);
  }

  try {
    queueProposalActivity(event.replace('proposal/', ''), id);
    return rpcSuccess(res, 'OK', id);
  } catch (err: any) {
    return rpcError(res, err, id);
  }
});

router.post('/subscriber', async (req, res) => {
  const { address } = req.body;

  try {
    const result = await getSubscriber(getAddress(address));

    return res.json(result);
  } catch (err: any) {
    if (err.message === 'RECORD_NOT_FOUND' || err.code === 'INVALID_ARGUMENT') {
      return res.json({ status: NOT_SUBSCRIBED });
    }

    capture(err, { body: req.body });
    return rpcError(res, err, address);
  }
});

router.get('/subscriptionsList', (req, res) => {
  return res.json(
    Object.fromEntries(
      SUBSCRIPTION_TYPE.map(k => [
        k,
        { name: templates[k].name, description: templates[k].description }
      ])
    )
  );
});

export default router;
