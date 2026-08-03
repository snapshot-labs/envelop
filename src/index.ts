import 'dotenv/config';
import './instrument';
import {
  capture,
  fallbackLogger,
  Sentry
} from '@snapshot-labs/snapshot-sentry';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import { runMigrations } from './db';
import initMetrics from './helpers/metrics';
import { rpcError } from './helpers/utils';
import preview from './preview';
import send from './preview/send';
import { shutdown as shutdownQueue, start as startQueue } from './queues';
import rpc from './rpc';

const app = express();
const PORT = process.env.PORT || 3006;

initMetrics(app);

app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ limit: '4mb', extended: false }));
app.use(express.static('./public'));
app.use(compression());
app.use(cors({ maxAge: 86400 }));
app.use('/', rpc);
app.use('/', preview);
app.use('/', send);

fallbackLogger(app);

app.use((_, res) => {
  rpcError(res, 'RECORD_NOT_FOUND', '');
});

let server: ReturnType<typeof app.listen>;

async function start() {
  await runMigrations();
  startQueue();
  server = app.listen(PORT, () =>
    console.log(`[http] Listening at http://localhost:${PORT}`)
  );
}

start().catch(async err => {
  console.error('Failed to start', err);
  capture(err);
  await Sentry.close(2000);
  process.exit(1);
});

async function shutdown() {
  if (server?.listening) {
    await new Promise(resolve => server.close(resolve));
    await Promise.all(shutdownQueue());
  }

  await Sentry.close(2000);
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
