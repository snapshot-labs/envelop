import { TemplatePrepareParams } from '../../../types';
import { getProposal } from '../../helpers/snapshot';
import buildMessage from '../builder';
import {
  formatProposalHtmlBody,
  formatUTCDate,
  linkWithTracker,
  truncateProposalBody
} from '../utils';

export default async function prepare(params: TemplatePrepareParams) {
  const proposal = await getProposal(params.id);

  if (!proposal || !proposal.space.verified) {
    throw new Error('Proposal not found');
  }

  const BODY_LENGTH = 1000;
  const { body: truncatedBody, isTruncated } = truncateProposalBody(
    proposal.body,
    BODY_LENGTH
  );

  proposal.link = linkWithTracker(proposal.link);

  return buildMessage('newProposal', {
    ...params,
    proposal,
    formattedStartDate: formatUTCDate(proposal.start),
    formattedEndDate: formatUTCDate(proposal.end),
    proposalTextBody: `${truncatedBody}${isTruncated ? ` [...]` : ''}`,
    proposalHtmlBody: formatProposalHtmlBody(
      proposal,
      truncatedBody,
      isTruncated
    )
  });
}
