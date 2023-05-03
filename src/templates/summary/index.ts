import { getProposals } from '../../helpers/snapshot';
import buildMessage from '../builder';
import type { TemplatePrepareParams } from '../../../types';

function formatDate(date: Date) {
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'long' });
  const year = date.getFullYear();

  const nthNumber = (number: number) => {
    if (number > 3 && number < 21) return 'th';
    switch (number % 10) {
      case 1:
        return 'st';
      case 2:
        return 'nd';
      case 3:
        return 'rd';
      default:
        return 'th';
    }
  };

  return `${month} ${day}${nthNumber(day)}, ${year}`;
}

export default async function prepare(params: TemplatePrepareParams) {
  const proposals = await getProposals(params.addresses, params.endDate);

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
    startDate,
    formattedStartDate: formatDate(startDate),
    formattedEndDate: formatDate(params.endDate),
    proposals,
    stats
  });
}
