import { compile } from 'handlebars';
import sgMail from '@sendgrid/mail';
import templates from '../templates';

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

  try {
    const result = await sgMail.send(msg);
    console.log('email sent', result);
  } catch (e) {
    console.log('email failed', e);
  }
}
