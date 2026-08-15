import { Proposal } from '../helpers/snapshot';

export const MAX_PROPOSAL_DELAY = 2 * 60 * 60 * 1000; // 2 hours

/**
 * Resolved by a mail processor when the email was not sent, because the
 * proposal turned out to be ineligible by the time the job ran.
 */
export const SKIPPED = 'Skipped';

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
