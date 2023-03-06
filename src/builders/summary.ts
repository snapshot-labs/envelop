import { getProposals } from '../helpers/snapshot';
import buildMail from './';

export default async function buildSummary(params: any): Promise<unknown> {
  params.proposals = await getProposals(params.address);

  return buildMail('summary', params);
}
