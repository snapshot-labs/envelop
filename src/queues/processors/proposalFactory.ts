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

export default async (job: Job): Promise<number> => {
  const { event, id } = job.data;
  const templateId = eventToTemplate(event);
  const proposal = await getProposal(id);

  if (!proposal) {
    return 0;
  }

  const subscribers = new Map(
    (await getVerifiedSubscriptions()).map(row => [row.address as string, row.email as string])
  );

  // Batch the function, as getFollows is limited to 1000 address per request
  const addressesChunks = chunk(Array.from(subscribers.keys()), 1000);
  const emails: string[] = [];
  for (const addressChunk of addressesChunks) {
    const follows = await getFollows(addressChunk, proposal.space.id);
    emails.push(...follows.map(follow => subscribers.get(follow.follower) as string).flat());
  }

  for (const email of emails) {
    await proposalActivityQueue.add(
      templateId,
      {
        email,
        id
      },
      { jobId: `${templateId}-${email}-${id}` }
    );
  }

  return emails.length;
};
