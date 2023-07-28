type MessageHeader = Record<string, string>;

export type Message = {
  to: string;
  from: string;
  subject: string;
  text: string;
  html: string;
  headers?: MessageHeader;
};

export type Template = {
  name: string;
  description: string;
  from: string;
  subject: string;
  text: string;
  preheader: string;
  html: string;
  prepare: (params: TemplatePrepareParams) => Promise<Message | Record<string, never>>;
};

export type TemplatePrepareParams = Record<string, any>;

export type TemplateId = 'summary' | 'verification' | 'newProposal' | 'closedProposal';
export type Templates = Record<TemplateId, Template>;
