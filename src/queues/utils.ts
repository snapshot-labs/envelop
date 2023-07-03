import type { Proposal } from '../helpers/snapshot';

export const MAX_NEW_PROPOSAL_DELAY = 2 * 60 * 60 * 1000; // 2 hours

export function newProposalDelay(proposal: Proposal) {
  let newProposalDelay = MAX_NEW_PROPOSAL_DELAY;
  const sendTimestamp = +new Date() + newProposalDelay;

  // Prevent sending new proposal email after it closes
  if (proposal.end <= sendTimestamp) {
    newProposalDelay = (proposal.end - +new Date()) * 0.75;
  }

  return newProposalDelay;
}
