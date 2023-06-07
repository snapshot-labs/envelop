import { getVerifiedSubscriptions } from '../../helpers/utils';
import { previousWeek } from '../../helpers/date';
import { mailerQueue } from '../index';
import constants from '../../helpers/constants.json';
import type { Dayjs } from 'dayjs';

/**
 * Return all subscribers email and wallet addresses,
 * grouped by email
 */
async function getGroupedSubscribers() {
  const subscriberEntries = await getVerifiedSubscriptions('summary');
  const subscribers: Record<string, string[]> = {};

  subscriberEntries.map(subscriber => {
    subscribers[subscriber.email as string] ||= [];
    subscribers[subscriber.email as string].push(subscriber.address as string);
  });

  return subscribers;
}

/**
 * Return an array of jobs
 */
async function buildJobs(summaryTimeRange: { start: Dayjs; end: Dayjs }) {
  const subscribers = await getGroupedSubscribers();

  return Object.keys(subscribers).map(email => ({
    name: 'summary',
    data: {
      email,
      addresses: subscribers[email].join(','),
      startTimestamp: +summaryTimeRange.start,
      endTimestamp: +summaryTimeRange.end
    },
    opts: {
      jobId: `summary-${email}-${+summaryTimeRange.start}`
    }
  }));
}

export default async () => {
  const summaryTimeRange = previousWeek(new Date(), constants.summary.timezone);
  const jobs = await buildJobs(summaryTimeRange);

  return (await mailerQueue.addBulk(jobs)).length;
};
