import { send } from './helpers/mail';
import constants from './helpers/constants.json';
import templates from './templates';

async function start() {
  const { to, address } = constants.example;

  const result = await send(await templates.summary.prepare({ to, address }));

  console.log('OK', result);
}

start();
