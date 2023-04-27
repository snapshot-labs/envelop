import { gql, ApolloClient, InMemoryCache, HttpLink } from '@apollo/client/core';
import fetch from 'cross-fetch';
import removeMd from 'remove-markdown';

const SNAPSHOT_HUB_URL = 'https://hub.snapshot.org/graphql';

const client = new ApolloClient({
  link: new HttpLink({ uri: SNAPSHOT_HUB_URL, fetch }),
  cache: new InMemoryCache({
    addTypename: false
  }),
  defaultOptions: {
    query: {
      fetchPolicy: 'no-cache'
    }
  }
});

const FOLLOWS_QUERY = gql`
  query Follows($follower_in: [String]) {
    follows(where: { follower_in: $follower_in }, first: 100) {
      space {
        id
      }
    }
  }
`;

const PROPOSALS_QUERY = gql`
  query Proposals($space_in: [String], $start_gt: Int) {
    proposals(where: { space_in: $space_in, start_gt: $start_gt }, first: 100) {
      id
      body
      title
      start
      end
      state
      link
      space {
        id
        name
      }
    }
  }
`;

const VOTES_QUERY = gql`
  query Votes($proposal_in: [String], $voter_in: [String]) {
    votes(where: { proposal_in: $proposal_in, voter_in: $voter_in }, first: 100) {
      id
      proposal {
        id
      }
    }
  }
`;

export const fetchProposals = async (addresses: string[], endDate: Date) => {
  const now = Math.floor(+endDate / 1e3);

  const {
    data: { follows }
  } = await client.query({
    query: FOLLOWS_QUERY,
    variables: {
      follower_in: addresses
    }
  });

  const {
    data: { proposals }
  } = await client.query({
    query: PROPOSALS_QUERY,
    variables: {
      space_in: follows.map(follow => follow.space.id),
      start_gt: now - 604800
    }
  });

  const {
    data: { votes }
  } = await client.query({
    query: VOTES_QUERY,
    variables: {
      proposal_in: proposals.map(proposal => proposal.id),
      voter_in: addresses
    }
  });

  return { proposals, votes };
};

export async function getProposals(
  addresses: string[],
  endDate = new Date(),
  maxShortBodyLength = 150
) {
  const { proposals, votes } = await fetchProposals(addresses, endDate);

  const groupedProposals: Record<string, { space: any; proposals: any[] }[]> = {
    pending: [],
    active: [],
    closed: []
  };

  const votedProposals = votes.map(vote => vote.proposal.id);
  proposals.forEach(proposal => {
    const sanitizedBody = removeMd(proposal.body);

    proposal.shortBody = (
      sanitizedBody.length > maxShortBodyLength
        ? `${sanitizedBody.slice(0, maxShortBodyLength)}…`
        : sanitizedBody
    ).replace(/\r?\n|\r/g, ' ');

    proposal.voted = votedProposals.includes(proposal.id);
  });

  Object.keys(groupedProposals).forEach(status => {
    const groupedSpaces = {};

    proposals
      .filter(proposal => proposal.state === status)
      .forEach(proposal => {
        const { space } = proposal;

        groupedSpaces[space.id] ||= { space, proposals: [] };
        groupedSpaces[space.id].proposals.push(proposal);
      });

    groupedProposals[status] = Array.from(Object.values(groupedSpaces));
  });

  return groupedProposals;
}
