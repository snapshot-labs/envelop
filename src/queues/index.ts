import Queue from 'bull';
import summaryProcessor from './processors/summary';
import schedulerProcessor from './processors/scheduler';
import constants from '../helpers/constants.json';
import subscribeProcessor from './processors/subscribe';

export const mailerQueue = new Queue('mailer', process.env.REDIS_URL as string);
export const scheduleQueue = new Queue('scheduler', process.env.REDIS_URL as string);

export function start(): void {
  console.log('[QUEUE-MAILER] Starting queue mailer');

  mailerQueue.process('summary', summaryProcessor);
  mailerQueue.process('subscribe', subscribeProcessor);
  scheduleQueue.process(schedulerProcessor);
  queueScheduler({ repeat: { cron: '0 1 * * MON', tz: constants.summary.timezone } });
}

export function shutdown(): Promise<void>[] {
  return [mailerQueue.close(), scheduleQueue.close()];
}

export function queueScheduler(options: Queue.JobOptions = {}): Promise<Queue.Job<any>> {
  return scheduleQueue.add({}, options);
}

export function queueSubscribe(email: string, address: string) {
  return mailerQueue.add('subscribe', { email, address });
}
