import { send } from './helpers/mail';
import constants from './helpers/constants.json';
import prepare from './templates/summary';


async function start() {
  const { to, address } = constants.example;

  const result = await send(await prepare({ to, address }));

  console.log('OK', result);
}

start();
