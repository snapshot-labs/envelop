import fs from 'fs';
import { compile } from 'handlebars';
import templates from '../templates';
import constants from '../helpers/constants.json';
import { sign as getSignature } from '../sign';

export default async function preview(req, res) {
  const params = {
    to: constants.example.to,
    address: [constants.example.address],
    signature: await getSignature(constants.example.to, constants.example.address, req.params)
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
