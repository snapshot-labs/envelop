import express from 'express';
import fs from 'fs';
import { compile } from 'handlebars';
import { TemplateId } from '../../types';
import { buildMessage } from './utils';

const router = express.Router();

router.get('/preview/:template', async (req, res) => {
  let msg;

  try {
    msg = await buildMessage(req.params.template as TemplateId, {
      sendDate: req.query.sendDate ? new Date(req.query.sendDate as string) : new Date(),
      id: req.query.id
    });
  } catch (e) {
    return res.sendStatus(404);
  }

  if (Object.keys(msg).length === 0) {
    return res.send('No preview available');
  }

  res.send(compile(fs.readFileSync('./src/preview/layout.hbs', 'utf-8'))(msg));
});

export default router;
