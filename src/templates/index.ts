import fs from 'fs';

const templates = {
  subscribe: {
    from: 'Snapshot <notify@snapshot.org>',
    subject: 'Verify your email address',
    text: 'Verify your email by visiting the following link in your browser: {{verifyLink}}',
    preheader: 'Verify your email to confirm your weekly summary subscription ',
    html: fs.readFileSync('./src/templates/subscribe/index.hbs', 'utf-8')
  },
  summary: {
    from: 'Snapshot <notify@snapshot.org>',
    subject: 'Your weekly Snapshot summary',
    text: "Hi {{ name }} don't miss out on proposals!",
    preheader: '',
    html: fs.readFileSync('./src/templates/summary/index.hbs', 'utf-8')
  }
};

export default templates;
