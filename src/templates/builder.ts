import { compile } from 'handlebars';
import juice from 'juice';
import sass from 'sass';
import { unsubscribeLink, loadPartials } from './utils';
import templates from './';
import type { Message, TemplatePrepareParams, TemplateId } from '../../types';

loadPartials();

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
    preheader: compile(template.preheader)(params)
  };

  if (id !== 'subscribe') {
    extraParams.unsubscribeLink = await unsubscribeLink(params.to);
    headers['List-Unsubscribe'] = `<${extraParams.unsubscribeLink}>`;
  }

  if (extraParams.preheader.length > 0) {
    extraParams.preheader = `${extraParams.preheader}${'&nbsp;&zwnj;'.repeat(
      150 - extraParams.preheader.length
    )}`;
  }

  return {
    to: params.to,
    from: compile(template.from)(params),
    subject: compile(template.subject)(params),
    preheader: extraParams.preheader,
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
