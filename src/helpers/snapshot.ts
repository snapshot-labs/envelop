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
  query Follows($follower_in: [String], $space: String) {
    follows(where: { follower_in: $follower_in, space: $space }, first: 100) {
      follower
      space {
        id
      }
    }
  }
`;

const PROPOSALS_QUERY = gql`
  query Proposals($space_in: [String], $start_gt: Int, $start_lt: Int) {
    proposals(
      where: { space_in: $space_in, start_gt: $start_gt, start_lt: $start_lt }
      first: 100
    ) {
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

const PROPOSAL_QUERY = gql`
  query Proposal($id: String) {
    proposal(id: $id) {
      id
      body
      title
      start
      end
      state
      link
      choices
      author
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

type Space = { id: string; name?: string };
type Follow = { space: Space; follower: string };
export type Proposal = {
  id: string;
  body: string;
  title: string;
  start: number;
  end: number;
  state: string;
  link: string;
  space: Space;
  shortBody?: string;
  voted?: boolean;
};
export type Vote = {
  id: string;
  proposal: Pick<Proposal, 'id'>;
};
export type ProposalStatus = 'pending' | 'active' | 'closed';
export type GroupedSpaces = { space: Space; proposals: Proposal[] };
export type GroupedProposals = Record<ProposalStatus, GroupedSpaces[]>;

export const fetchProposals = async (addresses: string[], startDate: Date, endDate: Date) => {
  const {
    data: { follows }
  }: { data: { follows: Follow[] } } = await client.query({
    query: FOLLOWS_QUERY,
    variables: {
      follower_in: addresses
    }
  });

  const {
    data: { proposals }
  }: { data: { proposals: Proposal[] } } = await client.query({
    query: PROPOSALS_QUERY,
    variables: {
      space_in: follows.map(follow => follow.space.id),
      start_gt: Math.floor(+startDate / 1e3),
      start_lt: Math.floor(+endDate / 1e3)
    }
  });

  const {
    data: { votes }
  }: { data: { votes: Vote[] } } = await client.query({
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
  startDate: Date,
  endDate: Date,
  maxShortBodyLength = 150
) {
  const { proposals, votes } = await fetchProposals(addresses, startDate, endDate);

  const groupedProposals: GroupedProposals = {
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
    const groupedSpaces: Record<string, GroupedSpaces> = {};
    proposals
      .filter(proposal => proposal.state === status)
      .forEach(proposal => {
        const { space } = proposal;

        groupedSpaces[space.id] ||= { space, proposals: [] };
        groupedSpaces[space.id].proposals.push(proposal);
      });

    groupedProposals[status as keyof GroupedProposals] = Array.from(Object.values(groupedSpaces));
  });

  return groupedProposals;
}

export async function getProposal(id: string) {
  const {
    data: { proposal }
  }: { data: { proposal: Proposal | null } } = await client.query({
    query: PROPOSAL_QUERY,
    variables: {
      id
    }
  });

  return proposal;
}

export async function getFollows(followers: string[], space?: string) {
  const {
    data: { follows }
  }: { data: { follows: Follow[] } } = await client.query({
    query: FOLLOWS_QUERY,
    variables: {
      follower_in: followers,
      space
    }
  });

  return follows;
}
