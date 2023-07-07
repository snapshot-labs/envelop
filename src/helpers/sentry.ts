import * as Sentry from '@sentry/node';
import type { Express } from 'express';
import { rpcError } from './utils';

export function initLogger(app: Express) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app }),
      ...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations()
    ],

    tracesSampleRate: parseFloat(process.env.SENTRY_TRACE_SAMPLE_RATE as string)
  });

  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
}

export function fallbackLogger(app: Express) {
  app.use(Sentry.Handlers.errorHandler());

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: any, req: any, res: any, _: any) => {
    return rpcError(res, err, '');
  });
}

export function capture(e: any) {
  Sentry.captureException(e);
}
