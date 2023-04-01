import { getProposals } from '../../helpers/snapshot';
import { formatShortDate } from '../../helpers/date';
import buildMessage from '../builder';
import constants from '../../helpers/constants.json';

export default async function prepare(params: any) {
  const proposals = await getProposals(params.addresses, params.startDate, params.endDate);
  const { timezone } = constants.summary;

  if (Object.values(proposals).every(p => p.length === 0)) {
    return {};
  }

  return buildMessage('summary', {
    ...params,
    formattedStartDate: formatShortDate(params.startDate, timezone),
    formattedEndDate: formatShortDate(params.endDate, timezone),
    proposals
  });
}
