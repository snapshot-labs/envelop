import { getProposals } from '../../helpers/snapshot';
import buildMessage from '../builder';

export default async function prepare(params: any) {
  const proposals = await getProposals(params.addresses);

  return buildMessage('summary', { ...params, proposals });
}
