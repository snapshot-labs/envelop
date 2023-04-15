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
  from: string;
  subject: string;
  text: string;
  preheader: string;
  html: string;
  prepare: (params: TemplatePrepareParams) => Promise<Message>;
};

export type TemplatePrepareParams = Record<string, any>;

export type TemplateId = 'summary' | 'subscribe';
export type Templates = Record<TemplateId, Template>;
