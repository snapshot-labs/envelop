import fs from 'fs';
import { compile } from 'handlebars';
import templates from '../templates';

export default async function preview(req, res) {
  const params = {
    to: req.query.to || 'fabien@bonustrack.co',
    address: req.query.address || '0xeF8305E140ac520225DAf050e2f71d5fBcC543e7'
  };
  const { template } = req.params;
  let msg;

  if (templates[template]) {
    msg = await templates[template].prepare(params);
  } else {
    return res.sendStatus(404);
  }

  const content = compile(fs.readFileSync('./src/preview/layout.hbs', 'utf-8'))(msg);

  res.send(content);
}
