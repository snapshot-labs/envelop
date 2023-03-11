import fs from 'fs';
import Handlebars, { compile } from 'handlebars';
import templates from './';
import styles from '../helpers/styles.json';

Handlebars.registerPartial(
  'layout',
  fs.readFileSync('./src/templates/partials/layout.hbs', 'utf-8')
);
Handlebars.registerPartial(
  'proposals',
  fs.readFileSync('./src/templates/partials/proposals.hbs', 'utf-8')
);

export default function buildMessage(id: string, params: any) {
  const template = templates[id];
  params.styles = styles;

  return {
    to: params.to,
    from: compile(template.from)(params),
    subject: compile(template.subject)(params),
    text: compile(template.text)(params),
    html: compile(template.html)(params)
  };
}
