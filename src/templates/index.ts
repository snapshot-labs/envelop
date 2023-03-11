import fs from 'fs';

const templates = {
  subscribe: {
    from: 'Snapshot <notify@snapshot.org>',
    subject: 'Verify your email address',
    text: 'Verify your email by visiting the following link in your browser: {{verifyLink}}',
    html: fs.readFileSync('./src/templates/subscribe/index.hbs', 'utf-8')
  },
  summary: {
    from: 'Snapshot <notify@snapshot.org>',
    subject: 'Summary',
    text: "Hi {{ name }} don't miss out on proposals!",
    html: fs.readFileSync('./src/templates/summary/index.hbs', 'utf-8')
  }
};

export default templates;
