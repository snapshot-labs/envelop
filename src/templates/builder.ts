import fs from 'fs';
import Handlebars, { compile } from 'handlebars';
import juice from 'juice';
import sass from 'sass';
import { unsubscribe as signUnsubscribe } from '../sign';
import templates from './';
import type { Message, TemplatePrepareParams, TemplateId } from '../../types';

Handlebars.registerPartial(
  'layout',
  fs.readFileSync('./src/templates/partials/layout.hbs', 'utf-8')
);
Handlebars.registerPartial(
  'proposalsHtml',
  fs.readFileSync('./src/templates/partials/proposals-html.hbs', 'utf-8')
);
Handlebars.registerPartial(
  'proposalsText',
  fs.readFileSync('./src/templates/partials/proposals-text.hbs', 'utf-8')
);

export async function unsubscribeLink(email: string) {
  return `${process.env.FRONT_HOST}/#/unsubscribe?${new URLSearchParams({
    signature: await signUnsubscribe(email),
    email: email
  }).toString()}`;
}

export default async function buildMessage(id: TemplateId, params: TemplatePrepareParams) {
  const template = templates[id];
  const headers: Message['headers'] = {};

  const extraParams: {
    host: string;
    subject: string;
    unsubscribeLink?: string;
    preheader: string;
  } = {
    host: process.env.HOST as string,
    subject: template.subject,
    preheader: template.preheader
  };

  if (id !== 'subscribe') {
    extraParams.unsubscribeLink = await unsubscribeLink(params.to);
    headers['List-Unsubscribe'] = `<${extraParams.unsubscribeLink}>`;
  }

  return {
    to: params.to,
    from: compile(template.from)(params),
    subject: compile(template.subject)(params),
    text: compile(template.text)({
      ...params,
      ...extraParams
    }),
    html: juice(
      compile(template.html)({
        ...params,
        ...extraParams
      }),
      {
        extraCss: sass.compile('./src/templates/styles/styles.scss').css
      }
    ),
    headers
  } as Message;
}
