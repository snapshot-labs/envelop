import { MAX_PROPOSAL_DELAY, proposalDelay } from '../../../src/queues/utils';

describe('proposalFactory', () => {
  describe('proposalDelay()', () => {
    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date('2026-08-04T12:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('returns MAX_PROPOSAL_DELAY if proposal is ending after the delay', () => {
      const proposal = {
        end: (Date.now() + MAX_PROPOSAL_DELAY * 10) / 1000
      };
      const result = proposalDelay(proposal as any);
      expect(result).toBe(MAX_PROPOSAL_DELAY);
    });

    it('returns voting period * 0.75 if proposal end before delay', () => {
      const proposal = {
        end: (Date.now() + 1000) / 1000
      };
      const result = proposalDelay(proposal as any);
      expect(result).toBe(750);
    });
  });
});
