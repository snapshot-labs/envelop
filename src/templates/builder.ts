import fs from 'fs';
import Handlebars, { compile } from 'handlebars';
import templates from './';
import styles from '../helpers/styles.json';

export default function buildMessage(id: string, params: any) {
  const template = templates[id];
  params.styles = styles;

  Handlebars.registerPartial('layout', fs.readFileSync('./src/templates/layout.hbs', 'utf-8'));

  return {
    to: params.to,
    from: compile(template.from)(params),
    subject: compile(template.subject)(params),
    text: compile(template.text)(params),
    html: compile(template.html)(params)
  };
}
