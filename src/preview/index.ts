import fs from 'fs';
import { compile } from 'handlebars';
import prepareSubscribe from '../templates/subscribe';
import prepareSummary from '../templates/summary';

export default async function preview(req, res) {
  const params = {
    to: req.query.to || 'fabien@bonustrack.co',
    address: req.query.address || '0xeF8305E140ac520225DAf050e2f71d5fBcC543e7'
  };
  let msg;

  switch (req.params.template) {
    case 'subscribe':
      msg = await prepareSubscribe(params);
      break;
    case 'summary':
      msg = await prepareSummary(params);
      break;
    default:
      return res.sendStatus(404);
  }

  const content = compile(fs.readFileSync('./src/preview/layout.hbs', 'utf-8'))(msg);

  res.send(content);
}
