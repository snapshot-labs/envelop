import { compile } from 'handlebars';
import sgMail from '@sendgrid/mail';
import templates from '../templates';
import preview from './preview';

sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

export async function send(id: string, params: any) {
  const template = templates[id];
  const msg = {
    to: params.to,
    from: compile(template.from)(params),
    subject: compile(template.subject)(params),
    text: compile(template.text)(params),
    html: compile(template.html)(params)
  };

  if (process.env.PREVIEW === 'true') {
    try {
      const result: string = preview(id, msg);
      console.log(`preview email generated at ${result}`);
    } catch (e) {
      console.log('preview generation failed', e);
    }
  } else {
    try {
      const result = await sgMail.send(msg);
      console.log('email sent', result);
    } catch (e) {
      console.log('email failed', e);
    }
  }
}
