import sgMail from '@sendgrid/mail';
import { Message } from '../../types';

sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

export async function send(msg: Message) {
  try {
    const result = await sgMail.send(msg);
    console.log('email sent', result);
  } catch (e) {
    console.log('email failed', e);
  }
}
