import chunk from 'lodash.chunk';
import { proposalActivityQueue } from '../index';
import { getFollows, getProposal } from '../../helpers/snapshot';
import { getVerifiedSubscriptions } from '../../helpers/utils';
import type { Job } from 'bull';

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
async function getSubscribersEmailFollowingSpace(spaceId: string) {
  const subscribers = new Map(
    (await getVerifiedSubscriptions()).map(row => [row.address as string, row.email as string])
  );
  const results = [];

  // Batch the queries, as getFollows is limited to 1000 address per request
  const addressesChunks = chunk(Array.from(subscribers.keys()), 1000);
  for (const addressChunk of addressesChunks) {
    const follows = await getFollows(addressChunk, spaceId);
    results.push(...follows.map(follow => subscribers.get(follow.follower) as string).flat());
  }

  return results;
}

export default async (job: Job): Promise<number> => {
  const { event, id } = job.data;
  const templateId = eventToTemplate(event);
  const proposal = await getProposal(id);

  if (!proposal) {
    return 0;
  }

  const emails = await getSubscribersEmailFollowingSpace(proposal.space.id);
  return emails.map(async email => {
    await proposalActivityQueue.add(
      templateId,
      {
        email,
        id
      },
      { jobId: `${templateId}-${email}-${id}` }
    );
  }).length;
};
