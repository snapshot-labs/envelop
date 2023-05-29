import fs from 'fs';
import Handlebars from 'handlebars';
import { marked } from 'marked';
import { signUnsubscribe } from '../sign';

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

export function formatProposalHtmlBody(body: string, isTruncated: boolean) {
  return (
    marked
      .parse(`${body}${isTruncated ? `...` : ''}`)
      .replace(/<img[^>]*>/g, '')
      .replace(/(\n)(\s*[^<])/g, '<br/>$2') +
    (isTruncated ? '<a href="${proposal.link}">(read more)</a>' : '')
  );
}

export function formatPreheader(text: string, maxLength = 150) {
  if (text.length > 0 && text.length < maxLength) {
    return `${text}${'&nbsp;&zwnj;'.repeat(maxLength - text.length)}`;
  }

  return text;
}
