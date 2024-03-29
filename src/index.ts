import 'dotenv/config';
import express from 'express';
import compression from 'compression';
import cors from 'cors';
import { initLogger, fallbackLogger } from '@snapshot-labs/snapshot-sentry';
import rpc from './rpc';
import preview from './preview';
import send from './preview/send';
import { start as startQueue, shutdown as shutdownQueue } from './queues';
import { rpcError } from './helpers/utils';
import initMetrics from './helpers/metrics';

const app = express();
const PORT = process.env.PORT || 3006;

initLogger(app);
initMetrics(app);

startQueue();

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

const server = app.listen(PORT, () => console.log(`[http] Listening at http://localhost:${PORT}`));

function shutdown() {
  if (server.listening) {
    server.close(async () => {
      await Promise.all(shutdownQueue());
      process.exit(0);
    });
  }
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
