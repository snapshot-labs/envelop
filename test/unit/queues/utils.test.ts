import { MAX_PROPOSAL_DELAY, proposalDelay } from '../../../src/queues/utils';

describe('proposalFactory', () => {
  describe('proposalDelay()', () => {
    it('returns MAX_PROPOSAL_DELAY if proposal is ending after the delay', () => {
      const proposal = {
        end: +new Date() + MAX_PROPOSAL_DELAY * 10
      };
      const result = proposalDelay(proposal as any);
      expect(result).toBe(MAX_PROPOSAL_DELAY);
    });

    it('returns voting period * 0.75 if proposal end before delay', () => {
      const proposal = {
        end: +new Date() + 1000
      };
      const result = proposalDelay(proposal as any);
      expect(result).toBe(750);
    });
  });
});
