import removeMd from 'remove-markdown';
import { getProposals } from '../../helpers/snapshot';
import buildMessage from '../builder';

export default async function prepare(params: any) {
  const proposals = await getProposals(params.address);

  Object.keys(proposals).forEach(status => {
    proposals[status].forEach(proposal => {
      proposal.body = `${removeMd(proposal.body).slice(0, 150)}…`;
    });
  });

  return buildMessage('summary', { ...params, ...proposals });
}
