import chunk from 'lodash.chunk';
import { boss } from '../index';
import { getFollows, getProposal } from '../../helpers/snapshot';
import { getVerifiedSubscriptions } from '../../helpers/utils';
import { proposalDelay } from '../utils';
import type { Job } from 'pg-boss';

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
async function getSubscribersEmailFollowingSpace(templateId: string, spaceId: string) {
  const subscriberEntries = await getVerifiedSubscriptions(templateId);
  const subscriberKeyValuePairs: Iterable<[string, string]> = subscriberEntries.map(row => [
    row.address as string,
    row.email as string
  ]);
  const subscribers = new Map(subscriberKeyValuePairs);
  const results = [];

  // Batch the queries, as getFollows is limited to 1000 address per request
  const addressesChunks = chunk(Array.from(subscribers.keys()), 100);
  for (const addressChunk of addressesChunks) {
    const follows = await getFollows(addressChunk, spaceId);
    results.push(...follows.map(follow => subscribers.get(follow.follower) as string));
  }

  return results;
}

export default async (job: Job<any>): Promise<number> => {
  const { event, id } = job.data;
  const templateId = eventToTemplate(event);

  const proposal = await getProposal(id);

  if (!proposal || !proposal.space.verified || proposal.flagged) {
    return 0;
  }

  const emails = await getSubscribersEmailFollowingSpace(templateId, proposal.space.id);

  if (emails.length > 0) {
    await boss.insert(
      templateId,
      emails.map(email => ({
        data: {
          email,
          id
        },
        singletonKey: `${templateId}-${email}-${id}`,
        startAfter:
          templateId === 'newProposal' ? new Date(Date.now() + proposalDelay(proposal)) : undefined
      }))
    );
  }

  return emails.length;
};
