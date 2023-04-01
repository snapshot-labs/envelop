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
  const proposals = await getProposals(params.addresses, params.startDate, params.endDate);

  if (Object.values(proposals).every(p => p.length === 0)) {
    return {};
  }

  return buildMessage('summary', {
    ...params,
    formattedStartDate: formatDate(params.startDate),
    formattedEndDate: formatDate(params.endDate),
    proposals
  });
}
