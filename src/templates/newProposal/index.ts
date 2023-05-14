import { marked } from 'marked';
import buildMessage from '../builder';
import { getProposal } from '../../helpers/snapshot';
import type { TemplatePrepareParams } from '../../../types';

export default async function prepare(params: TemplatePrepareParams) {
  const proposal = await getProposal(params.id);

  if (!proposal) {
    throw new Error('Proposal not found');
  }

  const BODY_LENGTH = 1000;
  const truncatedBody = proposal.body.slice(0, BODY_LENGTH);

  return buildMessage('newProposal', {
    ...params,
    proposal,
    formattedStartDate: new Date(proposal.start * 1000).toUTCString(),
    formattedEndDate: new Date(proposal.end * 1000).toUTCString(),
    proposalTextBody: `${truncatedBody}${proposal.body.length > BODY_LENGTH ? ` [...]` : ''}`,
    proposalHtmlBody: marked
      .parse(
        `${truncatedBody}${
          proposal.body.length > BODY_LENGTH ? `... <a href="${proposal.link}">(read more)</a>` : ''
        }`
      )
      .replace(/<img[^>]*>/g, '')
  });
}
