import express from 'express';
import { capture } from '@snapshot-labs/snapshot-sentry';
import { version, name } from '../package.json';
import {
  subscribe,
  verify,
  unsubscribe,
  update,
  rpcError,
  rpcSuccess,
  isValidEmail,
  getSubscriber,
  NOT_SUBSCRIBED
} from './helpers/utils';
import { verifySubscribe, verifyUnsubscribe, verifyVerify, verifyUpdate } from './sign';
import { queueVerify, queueProposalActivity } from './queues';
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
    if (method === 'snapshot.subscribe') {
      if (!isValidEmail(params.email)) {
        return rpcError(res, 'INVALID_PARAMS', id);
      }

      if (verifySubscribe(params.email, params.address, params.signature)) {
        const subscriber = await subscribe(params.email, params.address);
        if (subscriber) {
          queueVerify(subscriber.email, subscriber.address, subscriber.created.toString());
        }
        return rpcSuccess(res, 'OK', id);
      }

      return rpcError(res, 'UNAUTHORIZED', id);
    } else if (method === 'snapshot.verify') {
      if (verifyVerify(params.email, params.address, params.salt, params.signature)) {
        await verify(params.email, params.address, params.salt);
        return rpcSuccess(res, 'OK', id);
      }

      return rpcError(res, 'UNAUTHORIZED', id);
    } else if (method === 'snapshot.unsubscribe') {
      if (verifyUnsubscribe(params.email, params.address, params.signature)) {
        await unsubscribe(params.email, params.address);
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
        params.address,
        params.address && params.address.length > 0 ? params.subscriptions : [],
        params.signature
      );

      if (isValidSignature) {
        await update(params.email, params.address, params.subscriptions);
        return rpcSuccess(res, 'OK', id);
      }

      return rpcError(res, 'UNAUTHORIZED', id);
    }
  } catch (e: any) {
    capture(e, { context: { body: req.body } });
    return rpcError(res, e, id);
  }
});

router.post('/webhook', async (req, res) => {
  const body = req.body || {};
  const event = body.event?.toString() ?? '';
  const id = body.id?.toString().replace('proposal/', '') ?? '';

  if (req.headers['authentication'] !== `${process.env.WEBHOOK_AUTH_TOKEN || ''}`) {
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
  } catch (e: any) {
    return rpcError(res, e, id);
  }
});

router.post('/subscriber', async (req, res) => {
  const { address } = req.body;

  try {
    const result = await getSubscriber(address);

    return res.json(result);
  } catch (e: any) {
    if (e.message === 'RECORD_NOT_FOUND') {
      return res.json({ status: NOT_SUBSCRIBED });
    }

    capture(e, { context: { address } });
    return rpcError(res, e, address);
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
