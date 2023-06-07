import removeMd from 'remove-markdown';
import { getFollows, getProposals, getVotes, Space, Proposal } from '../../helpers/snapshot';
import { formatShortDate } from '../../helpers/date';
import buildMessage from '../builder';
import constants from '../../helpers/constants.json';
import type { TemplatePrepareParams } from '../../../types';
import { getModerationList } from '../../helpers/utils';

type ProposalStatus = 'pending' | 'active' | 'closed';
type GroupedSpaces = { space: Space; proposals: Proposal[] };
type GroupedProposals = Record<ProposalStatus, GroupedSpaces[]>;

const MAX_SHORT_BODY_LENGTH = 150;

export async function getGroupedProposals(addresses: string[], startDate: Date, endDate: Date) {
  const { flaggedSpaces, flaggedProposals } = await getModerationList();

  const follows = await getFollows(addresses);
  const trustedSpaces = follows
    .map(follow => follow.space.id)
    .filter((spaceId: string) => !flaggedSpaces.includes(spaceId));
  const allProposals = await getProposals(trustedSpaces, startDate, endDate);
  const proposals = allProposals.filter(proposal => !flaggedProposals.includes(proposal.id));
  const votes = await getVotes(
    proposals.map(proposal => proposal.id),
    addresses
  );

  const groupedProposals: GroupedProposals = {
    pending: [],
    active: [],
    closed: []
  };

  const votedProposals = votes.map(vote => vote.proposal.id);
  proposals.forEach(proposal => {
    const sanitizedBody = removeMd(proposal.body);
    proposal.shortBody = (
      sanitizedBody.length > MAX_SHORT_BODY_LENGTH
        ? `${sanitizedBody.slice(0, MAX_SHORT_BODY_LENGTH)}…`
        : sanitizedBody
    ).replace(/\r?\n|\r/g, ' ');
    proposal.htmlShortBody = proposal.shortBody
      .replace(/https?:\/\//g, '')
      .replace(/([^<](\/|\.))/g, '<span>$1</span>');

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

export default async function prepare(params: TemplatePrepareParams) {
  const proposals = await getGroupedProposals(params.addresses, params.startDate, params.endDate);

  if (Object.values(proposals).every(p => p.length === 0)) {
    return {};
  }

  const startDate = new Date(params.endDate);
  startDate.setDate(startDate.getDate() - 7);

  const { timezone } = constants.summary;
  const stats: Record<string, number> = {};

  for (const [key, value] of Object.entries(proposals)) {
    stats[key] = value
      .map(groupedSpace => groupedSpace.proposals.length)
      .reduce((total, count) => total + count, 0);
  }

  return buildMessage('summary', {
    ...params,
    formattedStartDate: formatShortDate(params.startDate, timezone),
    formattedEndDate: formatShortDate(params.endDate, timezone),
    proposals,
    stats
  });
}
