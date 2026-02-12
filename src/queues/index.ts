import Queue from 'bull';
import Redis from 'ioredis';
import summaryProcessor from './processors/summary';
import schedulerProcessor from './processors/scheduler';
import constants from '../helpers/constants.json';
import verificationProcessor from './processors/verification';
import proposalFactoryProcessor from './processors/proposalFactory';
import newProposalProcessor from './processors/newProposal';
import closedProposalProcessor from './processors/closedProposal';
import { countSentEmails } from '../helpers/metrics';

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

const defaultJobOptions = {
  removeOnComplete: { age: 7 * 24 * 3600, count: 10000 },
  removeOnFail: { age: 14 * 24 * 3600, count: 5000 }
};

export const mailerQueue = new Queue('mailer', {
  ...opts,
  defaultJobOptions
});
export const scheduleQueue = new Queue('scheduler', {
  ...opts,
  defaultJobOptions
});
export const proposalActivityQueue = new Queue('proposal-activities', {
  ...opts,
  defaultJobOptions
});

mailerQueue.on('completed', job => {
  countSentEmails.inc({ type: job.name });
});

export function start() {
  console.log('[queue-mailer] Starting queue mailer');

  mailerQueue.process('summary', summaryProcessor);
  mailerQueue.process('verification', verificationProcessor);
  scheduleQueue.process(schedulerProcessor);
  proposalActivityQueue.process('proposalFactory', proposalFactoryProcessor);
  mailerQueue.process('newProposal', newProposalProcessor);
  mailerQueue.process('closedProposal', closedProposalProcessor);

  queueScheduler({ repeat: { cron: '0 1 * * MON', tz: constants.summary.timezone } });
}

export function shutdown() {
  return [mailerQueue.close(), scheduleQueue.close()];
}

export function queueScheduler(options: Queue.JobOptions = {}) {
  return scheduleQueue.add({}, options);
}

export function queueVerify(email: string, address: string, salt: string) {
  return mailerQueue.add('verification', { email, address, salt });
}

export function queueProposalActivity(event: string, id: string) {
  return proposalActivityQueue.add('proposalFactory', { event, id });
}
