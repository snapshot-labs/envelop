import fs from 'fs';
import prepareSubscribe from './subscribe';
import prepareSummary from './summary';
import prepareNewProposal from './newProposal';
import prepareClosedProposal from './closedProposal';
import type { Templates } from '../../types';

const templates: Templates = {
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
    subject: 'Your weekly Snapshot summary - {{formattedStartDate}} to {{formattedEndDate}}',
    text: fs.readFileSync('./src/templates/summary/text.hbs', 'utf-8'),
    preheader: '',
    html: fs.readFileSync('./src/templates/summary/html.hbs', 'utf-8'),
    prepare: params => prepareSummary(params)
  },
  newProposal: {
    from: 'Snapshot <notify@snapshot.org>',
    subject: '[{{proposal.space.name}}] New proposal: {{proposal.title}}',
    text: fs.readFileSync('./src/templates/newProposal/text.hbs', 'utf-8'),
    preheader:
      'Submitted by {{proposal.author}}, ' +
      'voting period from {{formattedStartDate}} to {{formattedEndDate}}',
    html: fs.readFileSync('./src/templates/newProposal/html.hbs', 'utf-8'),
    prepare: params => prepareNewProposal(params)
  },
  closedProposal: {
    from: 'Snapshot <notify@snapshot.org>',
    subject: '[{{proposal.space.name}}] Closed proposal: {{proposal.title}}',
    text: fs.readFileSync('./src/templates/closedProposal/text.hbs', 'utf-8'),
    preheader:
      '{{winningChoiceName}} {{winningChoicePercentage}}% | ' +
      '{{formattedVotesCount}} total votes | Voting ended on {{formattedEndDate}}',
    html: fs.readFileSync('./src/templates/closedProposal/html.hbs', 'utf-8'),
    prepare: params => prepareClosedProposal(params)
  }
};

export default templates;
