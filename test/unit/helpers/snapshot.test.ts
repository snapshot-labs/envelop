import {
  isProposalEligibleForEmail,
  Proposal
} from '../../../src/helpers/snapshot';
import { proposals } from '../../fixtures/proposals';

const eligible = proposals[0];

describe('isProposalEligibleForEmail', () => {
  it('accepts a proposal in a verified, unflagged space', () => {
    expect(isProposalEligibleForEmail(eligible)).toBe(true);
  });

  it.each<[string, Proposal | null]>([
    ['the proposal is missing', null],
    ['the proposal is flagged', { ...eligible, flagged: true }],
    [
      'the space is not verified',
      { ...eligible, space: { ...eligible.space, verified: false } }
    ],
    [
      'the space is flagged',
      { ...eligible, space: { ...eligible.space, flagged: true } }
    ]
  ])('rejects when %s', (_state, proposal) => {
    expect(isProposalEligibleForEmail(proposal)).toBe(false);
  });
});
