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

export default async (job: Job): Promise<any> => {
  const { event, id } = job.data;
  const templateId = eventToTemplate(event);
  const proposal = await getProposal(id);

  if (!proposal) {
    return true;
  }

  const subscriptions = new Map(
    (await getVerifiedSubscriptions()).map(row => [row.address, row.email])
  );

  const addressesChunks = chunk(Array.from(subscriptions.keys()), 1000);
  for (const addressChunk of addressesChunks) {
    const follows = await getFollows(addressChunk, proposal.space.id);

    follows.map(follow => {
      proposalActivityQueue.add(templateId, {
        email: subscriptions.get(follow.follower),
        id
      });
    });
  }
};
