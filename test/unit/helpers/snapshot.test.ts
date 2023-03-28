import * as testSnapshot from '../../../src/helpers/snapshot';
import {
  proposals as mockedProposals,
  votes as mockedVotes,
  expectedProposalsByStatus,
  expectedProposalsBySpace,
  expectedShortBody,
  expectedSanitazedShortBody,
  expectedVotedProposals
} from '../../fixtures/proposals';

const proposalsById = (proposals, id) => {
  return Object.values(proposals)
    .flat()
    .map((s: any) => s.proposals)
    .flat()
    .filter(p => p.id === id)[0];
};

describe('snapshot', () => {
  describe('getProposals', () => {
    beforeEach(() => {
      jest
        .spyOn(testSnapshot, 'fetchProposals')
        .mockReturnValue(Promise.resolve({ proposals: mockedProposals, votes: mockedVotes }));
    });

    it.each([['active'], ['closed'], ['pending']])(
      'groups the proposals by %s status',
      async status => {
        const results = await testSnapshot.getProposals([]);

        expect(results[status].map(s => s.proposals.map(p => p.id)).flat()).toEqual(
          expectedProposalsByStatus[status]
        );
      }
    );

    it('groups the proposals by space', async () => {
      const results = await testSnapshot.getProposals([]);

      Object.keys(results).forEach(status => {
        expect(
          results[status].map(space => ({
            space: space.space.id,
            proposals: space.proposals.map(p => p.id)
          }))
        ).toEqual(expectedProposalsBySpace[status]);
      });
    });

    it.each(expectedShortBody)('truncates the body when necessary', async data => {
      const results = await testSnapshot.getProposals([], new Date(), data.length);

      expect(proposalsById(results, data.id).shortBody).toBe(data.shortBody);
    });

    it('includes whether the address has voted in the proposal', async () => {
      const results = await testSnapshot.getProposals([]);

      Object.values(results)
        .flat()
        .map((s: any) => s.proposals)
        .flat()
        .forEach(proposal =>
          expect(proposal.voted).toEqual(expectedVotedProposals.includes(proposal.id))
        );
    });

    it.each(expectedSanitazedShortBody)(
      'strips all markdown tags from the shortBody',
      async data => {
        const results = await testSnapshot.getProposals([]);

        expect(proposalsById(results, data.id).shortBody).toBe(data.shortBody);
      }
    );
  });
});
