import { send } from './helpers/mail';
import prepare from './templates/summary';

async function start() {
  const to = 'fabien@bonustrack.co';
  const address = '0xeF8305E140ac520225DAf050e2f71d5fBcC543e7';

  const result = await send(await prepare({ to, address }));

  console.log('OK', result);
}

start();
