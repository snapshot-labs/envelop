import fs from 'fs';
import prepareSubscribe from './subscribe';
import prepareSummary from './summary';

const templates = {
  subscribe: {
    from: 'Snapshot <notify@snapshot.org>',
    subject: "Don't miss out on these proposals {{ name }}",
    text: "Hi {{ name }} don't miss out on proposals!",
    html: fs.readFileSync('./src/templates/subscribe/index.hbs', 'utf-8'),
    prepare: params => prepareSubscribe(params)
  },
  summary: {
    from: 'Snapshot <notify@snapshot.org>',
    subject: 'Summary',
    text: "Hi {{ name }} don't miss out on proposals!",
    html: fs.readFileSync('./src/templates/summary/index.hbs', 'utf-8'),
    prepare: params => prepareSummary(params)
  }
};

export default templates;
