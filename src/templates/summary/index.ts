import { getProposals } from '../../helpers/snapshot';
import { formatShortDate } from '../../helpers/date';
import buildMessage from '../builder';
import constants from '../../helpers/constants.json';
import type { TemplatePrepareParams } from '../../../types';

export default async function prepare(params: TemplatePrepareParams) {
  const proposals = await getProposals(params.addresses, params.startDate, params.endDate);
  const { timezone } = constants.summary;

  if (Object.values(proposals).every(p => p.length === 0)) {
    return {};
  }
  const startDate = new Date(params.endDate);
  startDate.setDate(startDate.getDate() - 7);

  const stats: Record<string, number> = {};

  for (const [key, value] of Object.entries(proposals)) {
    stats[key] = value
      .map(groupedSpace => groupedSpace.proposals.length)
      .reduce((total, count) => total + count, 0);
  }

  return buildMessage('summary', {
    ...params,
    formattedStartDate: formatShortDate(params.startDate, timezone),
    formattedEndDate: formatShortDate(params.endDate, timezone),
    proposals,
    stats
  });
}
