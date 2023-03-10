import { getProposals } from '../../helpers/snapshot';
import buildMessage from '../builder';

export default async function prepare(params: any) {
  const proposals = await getProposals(params.address);

  return buildMessage('summary', { ...params, ...proposals });
}
