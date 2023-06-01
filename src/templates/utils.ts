import fs from 'fs';
import Handlebars from 'handlebars';
import { signUnsubscribe, signUpdate } from '../sign';

export async function unsubscribeLink(email: string) {
  return `${process.env.FRONT_HOST}/#/unsubscribe?${new URLSearchParams({
    signature: await signUnsubscribe(email),
    email: email
  }).toString()}`;
}

/**
 * Generate an updateSubscription link, signed by the backend
 * To be used in email footer, together with envelop-ui
 *
 * NOTE: This link uses a signature with an empty subscriptions, which will be
 * reused when envelop-ui send back the update request, to avoid
 * requesting the user for a signature when submitting the request.
 * Subscriptions params will be ignored when checking for signature validity
 * for all requests signed by envelop
 */
export async function updateSubscriptionsLink(email: string) {
  return `${process.env.FRONT_HOST}/#/update?${new URLSearchParams({
    signature: await signUpdate(email, '', []),
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
