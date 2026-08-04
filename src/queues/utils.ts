import { Proposal } from '../helpers/snapshot';

export const MAX_PROPOSAL_DELAY = 2 * 60 * 60 * 1000; // 2 hours

export function proposalDelay(proposal: Proposal) {
  let proposalDelay = MAX_PROPOSAL_DELAY;
  const now = Date.now();
  const proposalEnd = proposal.end * 1000;
  const sendTimestamp = now + proposalDelay;

  // Prevent sending new proposal email after it closes
  if (proposalEnd <= sendTimestamp) {
    proposalDelay = Math.ceil((proposalEnd - now) * 0.75);
  }

  return proposalDelay;
}
