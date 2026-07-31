import 'dotenv/config';
import './instrument';
import express from 'express';
import compression from 'compression';
import cors from 'cors';
import { capture, fallbackLogger } from '@snapshot-labs/snapshot-sentry';
import rpc from './rpc';
import preview from './preview';
import send from './preview/send';
import { start as startQueue, shutdown as shutdownQueue } from './queues';
import { runMigrations } from './db';
import { rpcError } from './helpers/utils';
import initMetrics from './helpers/metrics';

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
  await startQueue();
  server = app.listen(PORT, () => console.log(`[http] Listening at http://localhost:${PORT}`));
}

start().catch(err => {
  console.error('Failed to start', err);
  capture(err);
  process.exit(1);
});

function shutdown() {
  if (server?.listening) {
    server.close(async () => {
      await Promise.all(shutdownQueue());
      process.exit(0);
    });
  }
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
