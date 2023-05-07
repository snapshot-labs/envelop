import fs from 'fs';
import prepareSubscribe from './subscribe';
import prepareSummary from './summary';
import prepareProposalCreation from './proposalCreation';
import prepareProposalClosing from './proposalClosing';
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
  proposalCreation: {
    from: 'Snapshot <notify@snapshot.org>',
    subject: '[{{proposal.space.name}}] New proposal: {{proposal.title}}',
    text: fs.readFileSync('./src/templates/proposalCreation/text.hbs', 'utf-8'),
    preheader:
      'Submitted by {{proposal.author}}, voting period from {{formattedStartDate}} to {{formattedEndDate}}',
    html: fs.readFileSync('./src/templates/proposalCreation/html.hbs', 'utf-8'),
    prepare: params => prepareProposalCreation(params)
  },
  proposalClosing: {
    from: 'Snapshot <notify@snapshot.org>',
    subject: 'The proposal {{proposalTitle}} is now closed, with {{formattedVotesCount}} votes',
    text: fs.readFileSync('./src/templates/proposalClosing/text.hbs', 'utf-8'),
    preheader: '{{winChoicePercentage}}% have voted {{winChoiceName}}',
    html: fs.readFileSync('./src/templates/proposalClosing/html.hbs', 'utf-8'),
    prepare: params => prepareProposalClosing(params)
  }
};

export default templates;
