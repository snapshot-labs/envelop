import init, { client } from '@snapshot-labs/snapshot-metrics';
import { capture } from '@snapshot-labs/snapshot-sentry';
import { eq, gt } from 'drizzle-orm';
import { Express } from 'express';
import { db } from '../db';
import { subscribers } from '../schema';
import { subscribedTo } from './utils';
import { mailerQueue, proposalActivityQueue } from '../queues';
import { SUBSCRIPTION_TYPE } from '../templates';

export default function initMetrics(app: Express) {
  init(app, {
    normalizedPath: [
      ['^/preview/.*', '/preview/#template'],
      ['^/send/.*', '/send/#template']
    ],
    whitelistedPath: [
      /^\/$/,
      /^\/images\/.*\.png$/,
      /^\/(preview|send)\/.*$/,
      /^\/(webhook|subscriber|subscriptionsList)$/
    ],
    errorHandler: capture
  });
}

new client.Gauge({
  name: 'subscribers_per_status_count',
  help: 'Number of subscribers per status',
  labelNames: ['status'],
  async collect() {
    const [verified, unverified] = await Promise.all([
      db.$count(subscribers, gt(subscribers.verified, 0)),
      db.$count(subscribers, eq(subscribers.verified, 0))
    ]);

    this.set({ status: 'VERIFIED' }, verified);
    this.set({ status: 'UNVERIFIED' }, unverified);
  }
});

new client.Gauge({
  name: 'subscribers_per_subscription_count',
  help: 'Number of subscribers per subscription type',
  labelNames: ['type'],
  async collect() {
    await Promise.all(
      SUBSCRIPTION_TYPE.map(async type => {
        this.set({ type }, await db.$count(subscribers, subscribedTo(type)));
      })
    );
  }
});

new client.Gauge({
  name: 'mailing_queued_jobs_count',
  help: 'Number of emails in the queue, pending sending',
  async collect() {
    this.set(await mailerQueue.count());
  }
});

// New proposal mail waits on a fan-out job rather than on the mails
// themselves, so this backlog does not show up in mailing_queued_jobs_count.
new client.Gauge({
  name: 'mailing_pending_fanout_count',
  help: 'Number of proposal fan-out jobs pending recipient resolution',
  async collect() {
    this.set(await proposalActivityQueue.count());
  }
});

export const countSentEmails = new client.Counter({
  name: 'mailing_sent_count',
  help: 'Number of sent emails, per type',
  labelNames: ['type']
});

export const countSkippedEmails = new client.Counter({
  name: 'mailing_skipped_count',
  help: 'Number of mail jobs skipped without sending, per type',
  labelNames: ['type']
});
