import fs from 'fs';
import Handlebars from 'handlebars';
import { unsubscribe as signUnsubscribe } from '../sign';

export async function unsubscribeLink(email: string) {
  return `${process.env.FRONT_HOST}/#/unsubscribe?${new URLSearchParams({
    signature: await signUnsubscribe(email),
    email: email
  }).toString()}`;
}

export function loadPartials() {
  const extension = '.hbs';
  const partialDir = './src/templates/partials';

  fs.readdirSync(partialDir, { withFileTypes: true })
    .filter(item => item.name.endsWith(extension))
    .map(item => {
      Handlebars.registerPartial(
        item.name.replace(extension, ''),
        fs.readFileSync(`${partialDir}/${item.name}`, 'utf-8')
      );
    });
}