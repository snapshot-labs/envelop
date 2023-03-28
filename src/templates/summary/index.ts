import { getProposals } from '../../helpers/snapshot';
import buildMessage from '../builder';

function formatDate(date) {
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'long' });
  const year = date.getFullYear();

  const nthNumber = number => {
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

export default async function prepare(params: any) {
  const proposals = await getProposals(params.addresses, params.endDate);

  if (Object.values(proposals).every(p => p.length === 0)) {
    return {};
  }

  const startDate = new Date(params.endDate);
  startDate.setDate(startDate.getDate() - 7);

  return buildMessage('summary', {
    ...params,
    startDate,
    formattedStartDate: formatDate(startDate),
    formattedEndDate: formatDate(params.endDate),
    proposals
  });
}
