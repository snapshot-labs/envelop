import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rpc from './rpc';
import preview from './preview';
import send from './preview/send';
import { start as startQueue, shutdown as shutdownQueue } from './queues';

const app = express();
const PORT = process.env.PORT || 3006;

startQueue();

app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ limit: '4mb', extended: false }));
app.use(express.static('./public'));
app.use(cors({ maxAge: 86400 }));
app.use('/', rpc);
app.use('/', preview);
app.use('/', send);

const server = app.listen(PORT, () => console.log(`Listening at http://localhost:${PORT}`));

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
