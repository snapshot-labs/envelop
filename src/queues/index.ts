import Queue from 'bull';
import summaryProcessor from './processors/summary';
import schedulerProcessor from './processors/scheduler';

export const mailerQueue = new Queue('mailer', process.env.REDIS_URL as string);
export const scheduleQueue = new Queue('scheduler', process.env.REDIS_URL as string);

export function start(): void {
  console.log('[QUEUE-MAILER] Starting queue mailer');

  mailerQueue.process('summary', summaryProcessor);
  scheduleQueue.process(schedulerProcessor);

  queueScheduler({ repeat: { cron: '0 8 * * MON' } });
}

export function shutdown(): Promise<void>[] {
  return [mailerQueue.close(), scheduleQueue.close()];
}

export function queueScheduler(options: Queue.JobOptions = {}): Promise<Queue.Job<any>> {
  return scheduleQueue.add({}, options);
}
