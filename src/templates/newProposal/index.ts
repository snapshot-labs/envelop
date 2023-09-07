import buildMessage from '../builder';
import { formatProposalHtmlBody, linkWithTracker } from '../utils';
import { getProposal } from '../../helpers/snapshot';
import type { TemplatePrepareParams } from '../../../types';

export default async function prepare(params: TemplatePrepareParams) {
  const proposal = await getProposal(params.id);

  if (!proposal || !proposal.space.verified) {
    throw new Error('Proposal not found');
  }

  const BODY_LENGTH = 1000;
  const truncatedBody = proposal.body.slice(0, BODY_LENGTH);
  const isTruncated = proposal.body.length > BODY_LENGTH;

  proposal.link = linkWithTracker(proposal.link);

  return buildMessage('newProposal', {
    ...params,
    proposal,
    formattedStartDate: new Date(proposal.start * 1000).toUTCString(),
    formattedEndDate: new Date(proposal.end * 1000).toUTCString(),
    proposalTextBody: `${truncatedBody}${isTruncated ? ` [...]` : ''}`,
    proposalHtmlBody: formatProposalHtmlBody(proposal, truncatedBody, isTruncated)
  });
}
