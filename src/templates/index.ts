import fs from 'fs';
import prepareVerification from './verification';
import prepareSummary from './summary';
import prepareNewProposal from './newProposal';
import prepareClosedProposal from './closedProposal';
import type { Templates, TemplateId } from '../../types';

// List of subscriptions type, excluding system emails
export const SUBSCRIPTION_TYPE: TemplateId[] = ['summary', 'newProposal', 'closedProposal'];

const templates: Templates = {
  verification: {
    name: 'Verification',
    description: 'Verification email',
    from: 'Snapshot <notify@snapshot.org>',
    subject: 'Verify your email address',
    text: fs.readFileSync('./src/templates/verification/text.hbs', 'utf-8'),
    preheader: 'Verify your email to confirm your subscription to Snapshot mailing list',
    html: fs.readFileSync('./src/templates/verification/html.hbs', 'utf-8'),
    prepare: params => prepareVerification(params)
  },
  summary: {
    name: 'Weekly digest',
    description: 'Get a weekly report detailing the activity in your followed spaces.',
    from: 'Snapshot <notify@snapshot.org>',
    subject: 'Your weekly Snapshot summary - {{formattedStartDate}} to {{formattedEndDate}}',
    text: fs.readFileSync('./src/templates/summary/text.hbs', 'utf-8'),
    preheader: '',
    html: fs.readFileSync('./src/templates/summary/html.hbs', 'utf-8'),
    prepare: params => prepareSummary(params)
  },
  newProposal: {
    name: 'Proposal creation',
    description: 'Get informed when a new proposal is submitted in your followed spaces.',
    from: 'Snapshot <notify@snapshot.org>',
    subject: '[{{{proposal.space.name}}}] New proposal: {{{proposal.title}}}',
    text: fs.readFileSync('./src/templates/newProposal/text.hbs', 'utf-8'),
    preheader:
      'Voting period from {{formattedStartDate}} to {{formattedEndDate}} - ' +
      'Submitted by {{proposal.author}}',
    html: fs.readFileSync('./src/templates/newProposal/html.hbs', 'utf-8'),
    prepare: params => prepareNewProposal(params)
  },
  closedProposal: {
    name: 'Proposal closure',
    description: 'Get informed when a proposal is closed in your followed spaces.',
    from: 'Snapshot <notify@snapshot.org>',
    subject: '[{{{proposal.space.name}}}] Closed proposal: {{{proposal.title}}}',
    text: fs.readFileSync('./src/templates/closedProposal/text.hbs', 'utf-8'),
    preheader:
      '{{{winningChoiceName}}} {{winningChoicePercentage}}% - ' +
      '{{formattedVotesCount}} total votes - Voting ended on {{formattedEndDate}}',
    html: fs.readFileSync('./src/templates/closedProposal/html.hbs', 'utf-8'),
    prepare: params => prepareClosedProposal(params)
  }
};

export default templates;
