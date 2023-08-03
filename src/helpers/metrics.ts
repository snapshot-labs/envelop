import client from 'prom-client';
import promBundle from 'express-prom-bundle';
import db from './mysql';
import type { Express } from 'express';
import { SUBSCRIPTION_TYPE } from '../templates';
import { mailerQueue } from '../queues';

export default function initMetrics(app: Express) {
  initCustomMetrics();

  app.use(
    promBundle({
      includeMethod: true,
      includePath: true,
      promClient: {
        collectDefaultMetrics: {}
      },
      normalizePath: [
        ['^/preview/.*', '/preview/#template'],
        ['^/send/.*', '/send/#template']
      ]
    })
  );
}

async function initCustomMetrics() {
  new client.Gauge({
    name: 'subscribers_per_status_count',
    help: 'Number of subscribers per status',
    labelNames: ['status'],
    async collect() {
      [
        ['VERIFIED', 'verified > 0'],
        ['UNVERIFIED', 'verified IS NULL']
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
    name: 'queued_mailing_jobs',
    help: 'Number of emails in queue, pending sending',
    async collect() {
      this.set(await mailerQueue.count());
    }
  });
}
