import sgMail from '@sendgrid/mail';
import * as Sentry from '@sentry/node';
import { Message } from '../../types';

sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

export async function send(msg: Message) {
  try {
    const result = await sgMail.send(msg);
    console.log('[mail] Email sent', result);
  } catch (e) {
    Sentry.captureException(e);
    console.error('[mail] Email failed', e);
  }
}
