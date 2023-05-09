import { marked } from 'marked';
import buildMessage from '../builder';
import { getProposal } from '../../helpers/snapshot';
import type { TemplatePrepareParams } from '../../../types';

export default async function prepare(params: TemplatePrepareParams) {
  const proposal = await getProposal(params.id);

  if (!proposal) {
    throw new Error('Proposal not found');
  }

  const BODY_LENGTH = 500;
  const truncatedBody = proposal.body.slice(0, BODY_LENGTH);

  const winningChoice = proposal.scores?.indexOf(Math.max(...proposal.scores)) as number;
  const results = (
    proposal.choices?.map((choice, i) => {
      return {
        name: choice,
        progress: Math.round((100 / proposal.scores_total!) * proposal.scores![i]),
        winning: i === winningChoice
      };
    }) || []
  ).sort((a, b) => {
    return b.progress - a.progress;
  });

  return buildMessage('closedProposal', {
    ...params,
    proposal,
    results,
    formattedStartDate: new Date(proposal.start * 1000).toUTCString(),
    formattedEndDate: new Date(proposal.end * 1000).toUTCString(),
    formattedVotesCount: proposal.votes?.toLocaleString('en-US'),
    winningChoiceName: results[winningChoice].name,
    winningChoicePercentage: results[winningChoice].progress,
    proposalTextBody: `${truncatedBody}${proposal.body.length > BODY_LENGTH ? ` [...]` : ''}`,
    proposalHtmlBody: marked.parse(
      `${truncatedBody}${
        proposal.body.length > BODY_LENGTH ? `... <a href="${proposal.link}">(read more)</a>` : ''
      }`
    )
  });
}
