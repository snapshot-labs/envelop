import chunk from 'lodash.chunk';
import { mailerQueue } from '../index';
import { Proposal, getFollows, getProposal } from '../../helpers/snapshot';
import { getModerationList, getVerifiedSubscriptions } from '../../helpers/utils';
import type { Job } from 'bull';

export const MAX_NEW_PROPOSAL_DELAY = 2 * 60 * 60 * 1000; // 2 hours

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
  const addressesChunks = chunk(Array.from(subscribers.keys()), 1000);
  for (const addressChunk of addressesChunks) {
    const follows = await getFollows(addressChunk, spaceId);
    results.push(...follows.map(follow => subscribers.get(follow.follower) as string));
  }

  return results;
}

export function proposalDelay(proposal: Proposal) {
  let newProposalDelay = MAX_NEW_PROPOSAL_DELAY;
  const sendTimestamp = +new Date() + newProposalDelay;

  // Prevent sending new proposal email after it closes
  if (proposal.end <= sendTimestamp) {
    newProposalDelay = (proposal.end - +new Date()) * 0.75;
  }

  return newProposalDelay;
}

export default async (job: Job): Promise<number> => {
  const { event, id } = job.data;
  const templateId = eventToTemplate(event);
  const { flaggedProposals } = await getModerationList();
  if (flaggedProposals.includes(id)) {
    return 0;
  }

  const proposal = await getProposal(id);

  if (!proposal) {
    return 0;
  }

  const emails = await getSubscribersEmailFollowingSpace(templateId, proposal.space.id);
  await mailerQueue.addBulk(
    emails.map(email => ({
      name: templateId,
      data: {
        email,
        id
      },
      opts: {
        jobId: `${templateId}-${email}-${id}`,
        delay: templateId === 'newProposal' ? proposalDelay(proposal) : 0
      }
    }))
  );

  return emails.length;
};
