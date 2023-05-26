import Queue from 'bull';
import Redis from 'ioredis';
import summaryProcessor from './processors/summary';
import schedulerProcessor from './processors/scheduler';
import constants from '../helpers/constants.json';
import subscribeProcessor from './processors/subscribe';

const REDIS_URL = (process.env.REDIS_URL as string) || 'redis://127.0.0.1:6379';
const REDIS_OPTS = { maxRetriesPerRequest: null, enableReadyCheck: false };

const client = new Redis(REDIS_URL, REDIS_OPTS);
const subscriber = new Redis(REDIS_URL, REDIS_OPTS);

const opts = {
  createClient: function (type: string) {
    switch (type) {
      case 'client':
        return client;
      case 'subscriber':
        return subscriber;
      default:
        return new Redis(REDIS_URL, REDIS_OPTS);
    }
  }
};

export const mailerQueue = new Queue('mailer', opts);
export const scheduleQueue = new Queue('scheduler', opts);

export function start() {
  console.log('[queue-mailer] Starting queue mailer');

  mailerQueue.process('summary', summaryProcessor);
  mailerQueue.process('subscribe', subscribeProcessor);
  scheduleQueue.process(schedulerProcessor);

  queueScheduler({ repeat: { cron: '0 1 * * MON', tz: constants.summary.timezone } });
}

export function shutdown() {
  return [mailerQueue.close(), scheduleQueue.close()];
}

export function queueScheduler(options: Queue.JobOptions = {}) {
  return scheduleQueue.add({}, options);
}

export function queueSubscribe(email: string, address: string, salt: number) {
  return mailerQueue.add('subscribe', { email, address, salt });
}
