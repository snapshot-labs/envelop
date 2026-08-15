import { Job } from 'bull';
import chunk from 'lodash.chunk';
import {
  getFollows,
  getProposal,
  isProposalEligibleForEmail
} from '../../helpers/snapshot';
import { getVerifiedSubscriptions } from '../../helpers/utils';
import { mailerQueue, queueProposalFanOut } from '../index';
import { FAN_OUT_SCHEDULED, proposalDelay } from '../utils';

function eventToTemplate(event: string) {
  switch (event) {
    case 'created':
      return 'newProposal';
    case 'end':
      return 'closedProposal';
    default:
      throw new Error('Invalid proposal activity event type');
  }
}

/**
 * Return a list of email, for all subscribers following the given spaceId
 */
async function getSubscribersEmailFollowingSpace(
  templateId: string,
  spaceId: string
) {
  const subscriberEntries = await getVerifiedSubscriptions(templateId);
  const subscriberKeyValuePairs: Iterable<[string, string]> =
    subscriberEntries.map(row => [row.address as string, row.email as string]);
  const subscribers = new Map(subscriberKeyValuePairs);
  const results = [];

  // Batch the queries, as getFollows is limited to 1000 address per request
  const addressesChunks = chunk(Array.from(subscribers.keys()), 100);
  for (const addressChunk of addressesChunks) {
    const follows = await getFollows(addressChunk, spaceId);
    results.push(
      ...follows.map(follow => subscribers.get(follow.follower) as string)
    );
  }

  return results;
}

export default async (job: Job): Promise<number> => {
  const { event, id, fanOut } = job.data;
  const templateId = eventToTemplate(event);

  const proposal = await getProposal(id);

  if (!isProposalEligibleForEmail(proposal)) {
    return 0;
  }

  const delay =
    !fanOut && templateId === 'newProposal' ? proposalDelay(proposal) : 0;

  // Subscriptions keep changing while a new proposal email waits out its
  // delay, and queued jobs are not revisited when they do, so delay the
  // fan-out rather than each of the mails it produces.
  if (delay > 0) {
    await queueProposalFanOut(event, id, delay);
    return FAN_OUT_SCHEDULED;
  }

  const emails = await getSubscribersEmailFollowingSpace(
    templateId,
    proposal.space.id
  );
  await mailerQueue.addBulk(
    emails.map(email => ({
      name: templateId,
      data: {
        email,
        id
      },
      opts: {
        jobId: `${templateId}-${email}-${id}`
      }
    }))
  );

  return emails.length;
};
