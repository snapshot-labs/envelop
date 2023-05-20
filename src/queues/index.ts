import { JobsOptions, Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import constants from '../helpers/constants.json';
import createProposalActivitiesProcessor from './processors/createProposalActivities';
import createSummariesProcessor from './processors/createSummaries';
import sendSubscribeProcessor from './processors/sendSubscribe';
import sendSummaryProcessor from './processors/sendSummary';
import sendNewProposalProcessor from './processors/sendNewProposal';
import sendClosedProposalProcessor from './processors/sendClosedProposal';

const opts = {
  connection: new Redis((process.env.REDIS_URL as string) || 'redis://127.0.0.1:6379', {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
  })
};

// Factory queues, dedicated to queue jobs into send email queues
export const createSummariesQueue = new Queue('create-summaries', opts);
export const createProposalActivitiesQueue = new Queue('create-proposal-activities', opts);
// Send email queues, 1 queue for each email type
export const sendSubscribeQueue = new Queue('send-subscribe', opts);
export const sendSummaryQueue = new Queue('send-summary', opts);
export const sendNewProposalQueue = new Queue('send-new-proposal', opts);
export const sendClosedProposalQueue = new Queue('send-closed-proposal', opts);

const workers: Worker[] = [];

export function start() {
  console.log('[queue-mailer] Starting queue mailer');

  workers.concat([
    new Worker(createSummariesQueue.name, createSummariesProcessor, opts),
    new Worker(createProposalActivitiesQueue.name, createProposalActivitiesProcessor, opts),
    new Worker(sendSubscribeQueue.name, sendSubscribeProcessor, opts),
    new Worker(sendSummaryQueue.name, sendSummaryProcessor, opts),
    new Worker(sendNewProposalQueue.name, sendNewProposalProcessor, opts),
    new Worker(sendClosedProposalQueue.name, sendClosedProposalProcessor, opts)
  ]);

  console.log(`[queue-mailer] Started ${workers.length} workers`);

  queueCreateSummaries({ repeat: { pattern: '0 1 * * MON', tz: constants.summary.timezone } });
}

export function shutdown() {
  return workers.map(async worker => await worker.close());
}

export function queueSendSubscribe(email: string, address: string) {
  return sendSubscribeQueue.add('send-subscribe', { email, address });
}

export function queueCreateSummaries(options: JobsOptions = {}) {
  return createSummariesQueue.add('create-summaries', {}, options);
}

export function queueCreateProposalActivities(event: string, id: string) {
  return createProposalActivitiesQueue.add(
    'create-proposal-activities',
    { event, id },
    { jobId: `create-proposal-activities-${event}-${id}` }
  );
}
