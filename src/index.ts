import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rpc from './rpc';
import preview from './preview';
import send from './preview/send';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ limit: '4mb', extended: false }));
app.use(express.static('./public'));
app.use(cors({ maxAge: 86400 }));
app.use('/', rpc);
app.use('/', preview);
app.use('/', send);

app.listen(PORT, () => console.log(`Listening at http://localhost:${PORT}`));
