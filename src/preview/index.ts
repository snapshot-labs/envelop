import fs from 'fs';
import { compile } from 'handlebars';
import templates from '../templates';
import { getProposals } from '../helpers/snapshot';
import styles from '../helpers/styles.json';

export default async function preview(req, res) {
  const template = templates[req.params.template];

  if (!template) {
    return res.sendStatus(404);
  }

  const params = {
    to: req.query.to || 'fabien@bonustrack.co',
    name: req.query.name || 'Fabien',
    address: req.query.address || '0xeF8305E140ac520225DAf050e2f71d5fBcC543e7',
    proposals: {},
    styles
  };

  if (req.params.template === 'summary') {
    params.proposals = await getProposals(params.address);
  }

  const msg = {
    to: params.to,
    from: compile(template.from)(params),
    subject: compile(template.subject)(params),
    text: compile(template.text)(params),
    html: compile(template.html)(params)
  };

  const content = compile(fs.readFileSync('./src/preview/layout.hbs', 'utf-8'))(msg);

  res.send(content);
}
