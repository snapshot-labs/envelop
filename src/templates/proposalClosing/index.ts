import buildMessage from '../builder';
import type { TemplatePrepareParams } from '../../../types';
import { getProposal } from '../../helpers/snapshot';

export default async function prepare(params: TemplatePrepareParams) {
  const proposal = await getProposal(params.id);

  if (!proposal || proposal.state !== 'closed') {
    return {};
  }

  return buildMessage('proposalClosing', { ...params, proposal });
}
