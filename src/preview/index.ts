import express from 'express';
import fs from 'fs';
import { compile } from 'handlebars';
import { buildMessage } from './utils';
import type { TemplateId } from '../../types';

const router = express.Router();

router.get('/preview/:template', async (req, res) => {
  let msg;

  try {
    msg = await buildMessage(req.params.template as TemplateId);
  } catch (e) {
    return res.sendStatus(404);
  }

  res.send(compile(fs.readFileSync('./src/preview/layout.hbs', 'utf-8'))(msg));
});

export default router;
