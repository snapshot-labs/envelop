import { getProposals } from './helpers/snapshot';
import { send } from './helpers/mail';
import styles from './helpers/styles.json';

async function start() {
  const to = 'fabien@bonustrack.co';
  const address = '0xeF8305E140ac520225DAf050e2f71d5fBcC543e7';

  const proposals = await getProposals(address);

  const result = await send('summary', {
    to,
    address,
    proposals,
    styles
  });

  console.log('OK', result);
}

start();
