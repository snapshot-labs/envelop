import sgMail from '@sendgrid/mail';
import { Message } from '../../types';

sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

export async function send(msg: Message) {
  const result = await sgMail.send(msg);
  console.log('[mail] Email sent', result[0].statusCode, result[0].headers['x-message-id']);
}
