import init, { client } from '@snapshot-labs/snapshot-metrics';
import type { Express } from 'express';
import { SUBSCRIPTION_TYPE } from '../templates';
import { mailerQueue } from '../queues';
import db from './mysql';

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
    ]
  });
}

new client.Gauge({
  name: 'subscribers_per_status_count',
  help: 'Number of subscribers per status',
  labelNames: ['status'],
  async collect() {
    [
      ['VERIFIED', 'verified > 0'],
      ['UNVERIFIED', 'verified = 0']
    ].forEach(async function callback(this: any, data: any) {
      this.set(
        { status: data[0] },
        (await db.queryAsync(`SELECT count(*) as count FROM subscribers WHERE ${data[1]}`))[0]
          .count as any
      );
    }, this);
  }
});

new client.Gauge({
  name: 'subscribers_per_subscription_count',
  help: 'Number of subscribers per subscription type',
  labelNames: ['type'],
  async collect() {
    SUBSCRIPTION_TYPE.forEach(async function callback(this: any, type) {
      this.set(
        { type },
        (
          await db.queryAsync(
            `SELECT count(*) as count FROM subscribers WHERE verified > 0 AND JSON_CONTAINS(subscriptions, ?) OR subscriptions IS NULL`,
            JSON.stringify([type])
          )
        )[0].count as any
      );
    }, this);
  }
});

new client.Gauge({
  name: 'mailing_queued_jobs_count',
  help: 'Number of emails in the queue, pending sending',
  async collect() {
    this.set(await mailerQueue.count());
  }
});

export const countSentEmails = new client.Counter({
  name: 'mailing_sent_count',
  help: 'Number of sent emails, per type',
  labelNames: ['type']
});
