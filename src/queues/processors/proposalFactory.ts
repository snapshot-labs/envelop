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
    results.push(...follows.map(follow => subscribers.get(follow.follower) as string));
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
  await proposalActivityQueue.addBulk(
    emails.map(email => ({
      name: templateId,
      data: {
        email,
        id
      },
      opts: { jobId: `${templateId}-${email}-${id}` }
    }))
  );

  return emails.length;
};
