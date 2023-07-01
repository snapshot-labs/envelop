import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import * as Sentry from '@sentry/node';
import rpc from './rpc';
import preview from './preview';
import send from './preview/send';
import { start as startQueue, shutdown as shutdownQueue } from './queues';
import { rpcError } from './helpers/utils';

const app = express();
const PORT = process.env.PORT || 3006;

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app }),
    ...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations()
  ],
  tracesSampleRate: 0.5
});
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

startQueue();

app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ limit: '4mb', extended: false }));
app.use(express.static('./public'));
app.use(
  morgan(
    '[http] [:date[clf]] ' +
      '":method :url HTTP/:http-version" :status :res[content-length] ' +
      '":referrer" ":user-agent" - :response-time ms'
  )
);
app.use(cors({ maxAge: 86400 }));
app.use('/', rpc);
app.use('/', preview);
app.use('/', send);

app.use(Sentry.Handlers.errorHandler());

app.use(function onError(err: any, req: any, res: any) {
  res.statusCode = 500;
  res.end(`${res.sentry}\n`);
});

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
