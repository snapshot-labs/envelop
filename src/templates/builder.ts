import fs from 'fs';
import Handlebars, { compile } from 'handlebars';
import juice from 'juice';
import sass from 'sass';
import templates from './';

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

export default function buildMessage(id: string, params: any) {
  const template = templates[id];

  return {
    to: params.to,
    from: compile(template.from)(params),
    subject: compile(template.subject)(params),
    text: compile(template.text)(params),
    html: juice(
      compile(template.html)({
        ...params,
        host: process.env.HOST,
        subject: template.subject
      }),
      {
        extraCss: sass.compile('./src/templates/styles/styles.scss').css
      }
    )
  };
}
