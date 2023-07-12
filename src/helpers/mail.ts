import sgMail from '@sendgrid/mail';
import { capture } from '../helpers/sentry';
import { Message } from '../../types';

sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

export async function send(msg: Message) {
  try {
    const result = await sgMail.send(msg);
    console.log('[mail] Email sent', result);
  } catch (e) {
    capture(e);
    console.error('[mail] Email failed', e);
  }
}
