import fs from 'fs';
import prepareSubscribe from './subscribe';
import prepareSummary from './summary';

const templates = {
  subscribe: {
    from: 'Snapshot <notify@snapshot.org>',
    subject: 'Verify your email address',
    text: fs.readFileSync('./src/templates/subscribe/text.hbs', 'utf-8'),
    preheader: 'Verify your email to confirm your weekly summary subscription',
    html: fs.readFileSync('./src/templates/subscribe/html.hbs', 'utf-8'),
    prepare: params => prepareSubscribe(params)
  },
  summary: {
    from: 'Snapshot <notify@snapshot.org>',
    subject: 'Your weekly Snapshot summary',
    text: fs.readFileSync('./src/templates/summary/text.hbs', 'utf-8'),
    preheader: '',
    html: fs.readFileSync('./src/templates/summary/html.hbs', 'utf-8'),
    prepare: params => prepareSummary(params)
  }
};

export default templates;
