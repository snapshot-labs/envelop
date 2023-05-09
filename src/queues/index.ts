import Queue from 'bull';
import summaryProcessor from './processors/summary';
import schedulerProcessor from './processors/scheduler';
import constants from '../helpers/constants.json';
import subscribeProcessor from './processors/subscribe';
import proposalFactoryProcessor from './processors/proposalFactory';
import newProposalProcessor from './processors/newProposal';
import closedProposalProcessor from './processors/closedProposal';

const redisUrl = process.env.REDIS_URL as string;
export const mailerQueue = new Queue('mailer', redisUrl);
export const scheduleQueue = new Queue('scheduler', redisUrl);
export const proposalActivityQueue = new Queue('proposal-activities', redisUrl);

export function start(): void {
  console.log('[QUEUE-MAILER] Starting queue mailer');

  mailerQueue.process('summary', summaryProcessor);
  mailerQueue.process('subscribe', subscribeProcessor);
  scheduleQueue.process(schedulerProcessor);
  proposalActivityQueue.process('proposalFactory', proposalFactoryProcessor);
  proposalActivityQueue.process('newProposal', newProposalProcessor);
  proposalActivityQueue.process('closedProposal', closedProposalProcessor);

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

export function queueProposalActivity(event: string, id: string) {
  return proposalActivityQueue.add('proposalFactory', { event, id });
}
