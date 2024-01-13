import sgMail from '@sendgrid/mail';
import { capture } from '@snapshot-labs/snapshot-sentry';
import { Message } from '../../types';

sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

export async function send(msg: Message) {
  try {
    const result = await sgMail.send(msg);
    console.log('[mail] Email sent', result);
  } catch (e: any) {
    capture(e, { errors: e.response?.body?.errors });
    console.error('[mail] Email failed', JSON.stringify(e));
  }
}
