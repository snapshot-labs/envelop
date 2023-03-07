import { getProposals } from './helpers/snapshot';
import { send } from './helpers/mail';
import styles from './helpers/styles.json';
import constants from './helpers/constants.json';

async function start() {
  const { to, address } = constants.example;

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
