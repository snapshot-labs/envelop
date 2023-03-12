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

export const FOLLOWS_QUERY = gql`
  query Follows($follower: String) {
    follows(where: { follower: $follower }, first: 100) {
      space {
        id
      }
    }
  }
`;

export const PROPOSALS_QUERY = gql`
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

export async function getProposals(address: string) {
  const now = Math.floor(Date.now() / 1e3);

  const {
    data: { follows }
  } = await client.query({
    query: FOLLOWS_QUERY,
    variables: {
      follower: address
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
  const groupedProposals = {
    pending: {},
    active: {},
    closed: {}
  };

  proposals.forEach(proposal => {
    proposal.shortBody = `${removeMd(proposal.body).slice(0, 150)}…`;
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

    groupedProposals[status] = Object.values(groupedSpaces);
  });

  return groupedProposals;
}
