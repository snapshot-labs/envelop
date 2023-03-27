import express from 'express';
import fs from 'fs';
import { compile } from 'handlebars';
import templates from '../templates';
import constants from '../helpers/constants.json';
import { subscribe, unsubscribe } from '../sign';

const router = express.Router();

router.get('/preview/:template', async (req, res) => {
  const { template } = req.params;
  const params: { to: string; address?: string; addresses?: string[]; signature: string } = {
    to: constants.example.to,
    signature:
      template === 'subscribe'
        ? await subscribe(constants.example.to, constants.example.addresses[0])
        : await unsubscribe(constants.example.to, constants.example.addresses[0])
  };

  if (template === 'summary') {
    params.addresses = constants.example.addresses;
  } else {
    params.address = constants.example.addresses[0];
  }

  let msg;

  if (templates[template]) {
    msg = await templates[template].prepare(params);
  } else {
    return res.sendStatus(404);
  }

  const content = compile(fs.readFileSync('./src/preview/layout.hbs', 'utf-8'))(msg);

  res.send(content);
});

export default router;
