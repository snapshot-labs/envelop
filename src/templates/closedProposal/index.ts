import buildMessage from '../builder';
import { getProposal } from '../../helpers/snapshot';
import { formatProposalHtmlBody, formatUTCDate, linkWithTracker } from '../utils';
import type { TemplatePrepareParams } from '../../../types';

export default async function prepare(params: TemplatePrepareParams) {
  const proposal = await getProposal(params.id);

  if (!proposal || !proposal.space.verified) {
    throw new Error('Proposal not found');
  }

  const BODY_LENGTH = 500;
  const truncatedBody = proposal.body.slice(0, BODY_LENGTH);
  const isTruncated = proposal.body.length > BODY_LENGTH;

  const winningChoice = proposal.scores?.indexOf(Math.max(...proposal.scores));
  const results = (
    proposal.choices?.map((choice, i) => {
      return {
        name: choice,
        progress: Math.round(
          (100 / (proposal.scores_total || 1)) * (proposal.scores ? proposal.scores[i] : 1)
        ),
        winning: i === winningChoice
      };
    }) || []
  ).sort((a, b) => {
    return b.progress - a.progress;
  });
  const winningChoiceIndex = results.findIndex(p => p.winning);
  proposal.link = linkWithTracker(proposal.link);

  return buildMessage('closedProposal', {
    ...params,
    proposal,
    results,
    formattedStartDate: formatUTCDate(proposal.start),
    formattedEndDate: formatUTCDate(proposal.end),
    formattedVotesCount: proposal.votes?.toLocaleString('en-US'),
    winningChoiceName: results[winningChoiceIndex].name,
    winningChoicePercentage: results[winningChoiceIndex].progress,
    proposalTextBody: `${truncatedBody}${isTruncated ? ` [...]` : ''}`,
    proposalHtmlBody: formatProposalHtmlBody(proposal, truncatedBody, isTruncated)
  });
}
