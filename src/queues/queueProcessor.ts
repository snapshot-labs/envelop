import Queue from 'bull';
import summaryProcessor from './processors/summary';
import schedulerProcessor from './processors/scheduler';

export const mailerQueue = new Queue('mailer');
export const scheduleQueue = new Queue('scheduler');

export default class QueueProcessor {
  constructor() {
    console.log('[QUEUE-MAILER] Starting queue mailer');

    mailerQueue.process('summary', summaryProcessor);
    scheduleQueue.process(schedulerProcessor);

    this.queueScheduler({ repeat: { cron: '0 8 * * MON' } });
  }

  queueScheduler(options: Queue.JobOptions = {}): Promise<Queue.Job<any>> {
    return scheduleQueue.add({}, options);
  }

  shutdown(): Promise<void>[] {
    return [mailerQueue.close(), scheduleQueue.close()];
  }
}
