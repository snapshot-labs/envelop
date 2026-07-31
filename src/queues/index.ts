import { PgBoss, type Job, type JobWithMetadata } from 'pg-boss';
import { eq } from 'drizzle-orm';
import summaryProcessor from './processors/summary';
import schedulerProcessor from './processors/scheduler';
import constants from '../helpers/constants.json';
import verificationProcessor from './processors/verification';
import proposalFactoryProcessor from './processors/proposalFactory';
import newProposalProcessor from './processors/newProposal';
import closedProposalProcessor from './processors/closedProposal';
import { countSentEmails } from '../helpers/metrics';
import { capture } from '@snapshot-labs/snapshot-sentry';
import { db } from '../db';
import { sentEmails } from '../schema';

export const MAILER_QUEUES = ['summary', 'verification', 'newProposal', 'closedProposal'];
const QUEUES = [...MAILER_QUEUES, 'scheduler', 'proposal-activities'];

// Same retry profile as the previous Bull config: 3 total attempts,
// exponential backoff starting at 20s
const RETRY_OPTS = { retryLimit: 2, retryDelay: 20, retryBackoff: true };

export const boss = new PgBoss(process.env.DATABASE_URL as string);

boss.on('error', capture);

type Processor = (job: Job<any>) => Promise<any>;

// Mailer jobs carry a singletonKey used as a permanent idempotency key:
// pg-boss singletonKey only dedups jobs while they are queued, so completed
// sends are recorded in sent_emails to prevent re-sending on re-enqueue
async function alreadySent(key: string) {
  return (await db.$count(sentEmails, eq(sentEmails.id, key))) > 0;
}

function markSent(key: string) {
  return db.insert(sentEmails).values({ id: key, created: Date.now() }).onConflictDoNothing();
}

function work(queueName: string, processor: Processor, { isMailer = false } = {}) {
  return boss.work(queueName, { includeMetadata: true }, async ([job]: JobWithMetadata<any>[]) => {
    try {
      if (isMailer && job.singletonKey && (await alreadySent(job.singletonKey))) {
        return 'Skipped';
      }

      const result = await processor(job);

      if (isMailer) {
        if (job.singletonKey) await markSent(job.singletonKey);
        countSentEmails.inc({ type: queueName });
      }

      return result;
    } catch (e: any) {
      if (job.retryCount >= job.retryLimit) {
        capture(e, {
          queue: queueName,
          jobId: job.id,
          jobData: job.data
        });
      }
      throw e;
    }
  });
}

export async function start() {
  console.log('[queue-mailer] Starting queue mailer');

  await boss.start();
  await Promise.all(QUEUES.map(name => boss.createQueue(name, RETRY_OPTS)));

  await Promise.all([
    work('summary', summaryProcessor, { isMailer: true }),
    work('verification', verificationProcessor, { isMailer: true }),
    work('newProposal', newProposalProcessor, { isMailer: true }),
    work('closedProposal', closedProposalProcessor, { isMailer: true }),
    work('scheduler', schedulerProcessor),
    work('proposal-activities', proposalFactoryProcessor)
  ]);

  await boss.schedule('scheduler', '0 1 * * MON', {}, { tz: constants.summary.timezone });
}

export function shutdown() {
  return [boss.stop()];
}

export function queueScheduler() {
  return boss.send('scheduler', {});
}

export function queueVerify(email: string, address: string, salt: string) {
  return boss.send('verification', { email, address, salt });
}

export function queueProposalActivity(event: string, id: string) {
  return boss.send('proposal-activities', { event, id });
}
