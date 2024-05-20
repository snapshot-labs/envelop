import { gql, ApolloClient, InMemoryCache, HttpLink } from '@apollo/client/core';
import { fetchWithKeepAlive } from './utils';

const hub_url = new URL(process.env.HUB_URL || 'https://hub.snapshot.org');
hub_url.pathname = '/graphql';

const client = new ApolloClient({
  link: new HttpLink({ uri: hub_url.toString(), fetch: fetchWithKeepAlive as any }),
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
        verified
        flagged
      }
    }
  }
`;

const PROPOSALS_QUERY = gql`
  query Proposals($space_in: [String], $start_gt: Int, $start_lt: Int) {
    proposals(
      where: { space_in: $space_in, start_gt: $start_gt, start_lt: $start_lt, flagged: false }
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
        verified
        flagged
      }
      flagged
    }
  }
`;

const PROPOSAL_QUERY = gql`
  query Proposal($id: String!) {
    proposal(id: $id) {
      id
      body
      title
      start
      end
      state
      link
      choices
      scores
      scores_total
      votes
      author
      space {
        id
        name
        verified
        flagged
      }
      flagged
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

export type Space = { id: string; name?: string; verified: boolean; flagged: boolean };
export type Follow = { space: Space; follower: string };
export type Proposal = {
  id: string;
  body: string;
  title: string;
  start: number;
  end: number;
  state: string;
  link: string;
  space: Space;
  choices?: string[];
  scores?: number[];
  scores_total?: number;
  shortBody?: string;
  htmlShortBody?: string;
  voted?: boolean;
  votes?: number;
  flagged: boolean;
};
export type Vote = {
  id: string;
  proposal: Pick<Proposal, 'id'>;
};

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

export async function getProposals(spaces: string[], startDate: Date, endDate: Date) {
  const {
    data: { proposals }
  }: { data: { proposals: Proposal[] } } = await client.query({
    query: PROPOSALS_QUERY,
    variables: {
      space_in: spaces,
      start_gt: Math.floor(+startDate / 1e3),
      start_lt: Math.floor(+endDate / 1e3)
    }
  });

  return proposals;
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

export async function getVotes(proposals: string[], addresses: string[]) {
  const {
    data: { votes }
  }: { data: { votes: Vote[] } } = await client.query({
    query: VOTES_QUERY,
    variables: {
      proposal_in: proposals,
      voter_in: addresses
    }
  });

  return votes;
}
