import fs from 'fs';
import prepareSubscribe from './subscribe';
import prepareSummary from './summary';
import type { Templates, TemplateId } from '../../types';

// List of subscriptions type, excluding system emails
export const SUBSCRIPTIONS_TYPE: TemplateId[] = ['summary', 'newProposal', 'closedProposal'];

const templates: Templates = {
  subscribe: {
    name: 'Verification',
    description: 'Verification email',
    from: 'Snapshot <notify@snapshot.org>',
    subject: 'Verify your email address',
    text: fs.readFileSync('./src/templates/subscribe/text.hbs', 'utf-8'),
    preheader: 'Verify your email to confirm your weekly summary subscription',
    html: fs.readFileSync('./src/templates/subscribe/html.hbs', 'utf-8'),
    prepare: params => prepareSubscribe(params)
  },
  summary: {
    name: 'Weekly digest',
    description: "Weekly report of your followed spaces's activites",
    from: 'Snapshot <notify@snapshot.org>',
    subject: 'Your weekly Snapshot summary - {{formattedStartDate}} to {{formattedEndDate}}',
    text: fs.readFileSync('./src/templates/summary/text.hbs', 'utf-8'),
    preheader: '',
    html: fs.readFileSync('./src/templates/summary/html.hbs', 'utf-8'),
    prepare: params => prepareSummary(params)
  },
  newProposal: {
    name: 'New proposal',
    description: 'Notification when a new proposal is submitted in your followed spaces',
    from: '',
    subject: '',
    text: '',
    preheader: '',
    html: '',
    prepare: params => {
      return Promise.resolve({});
    }
  },
  closedProposal: {
    name: 'Closed proposal',
    description: 'Notification when a proposal in your followed spaces has closed',
    from: '',
    subject: '',
    text: '',
    preheader: '',
    html: '',
    prepare: params => {
      return Promise.resolve({});
    }
  }
};

export default templates;
