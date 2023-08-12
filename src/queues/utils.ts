import type { Proposal } from '../helpers/snapshot';

export const MAX_PROPOSAL_DELAY = 2 * 60 * 60 * 1000; // 2 hours

export function proposalDelay(proposal: Proposal) {
  let proposalDelay = MAX_PROPOSAL_DELAY;
  const sendTimestamp = +new Date() + proposalDelay;

  // Prevent sending new proposal email after it closes
  if (proposal.end <= sendTimestamp) {
    proposalDelay = Math.ceil((proposal.end - +new Date()) * 0.75);
  }

  return proposalDelay;
}
