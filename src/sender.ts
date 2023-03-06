import { send } from './helpers/mail';
import buildSummary from './builders/summary';

async function start() {
  const to = 'fabien@bonustrack.co';
  const address = '0xeF8305E140ac520225DAf050e2f71d5fBcC543e7';

  const result = await send(await buildSummary({ to, address }));

  console.log('OK', result);
}

start();
