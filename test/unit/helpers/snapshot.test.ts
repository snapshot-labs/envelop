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

const proposalsById = (proposals: testSnapshot.GroupedProposals, id: string) => {
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
        const results = await testSnapshot.getProposals([], new Date(), new Date());

        expect(
          results[status as testSnapshot.ProposalStatus].map(s => s.proposals.map(p => p.id)).flat()
        ).toEqual(expectedProposalsByStatus[status as testSnapshot.ProposalStatus]);
      }
    );

    it('groups the proposals by space', async () => {
      const results = await testSnapshot.getProposals([], new Date(), new Date());

      Object.keys(results).forEach(status => {
        expect(
          results[status as testSnapshot.ProposalStatus].map(space => ({
            space: space.space.id,
            proposals: space.proposals.map(p => p.id)
          }))
        ).toEqual(expectedProposalsBySpace[status as testSnapshot.ProposalStatus]);
      });
    });

    it.each(expectedShortBody)('truncates the body when necessary', async data => {
      const results = await testSnapshot.getProposals([], new Date(), new Date(), data.length);

      expect(proposalsById(results, data.id).shortBody).toBe(data.shortBody);
    });

    it('includes whether the address has voted in the proposal', async () => {
      const results = await testSnapshot.getProposals([], new Date(), new Date());

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
        const results = await testSnapshot.getProposals([], new Date(), new Date());

        expect(proposalsById(results, data.id).shortBody).toBe(data.shortBody);
      }
    );
  });
});
