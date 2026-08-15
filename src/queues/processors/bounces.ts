import { fetchBouncedEmails } from '../../helpers/sendgrid';
import { markBounced } from '../../helpers/utils';

/**
 * Reconcile the subscribers table with the addresses SendGrid has suppressed.
 *
 * Polling is used because it needs nothing but an API key scope. An Event
 * Webhook reports the same bounces as they happen and can be added later
 * without touching how they are stored or applied: it only has to call
 * markBounced(), leaving this sweep as a backstop for anything a webhook
 * delivery missed.
 */
export default async (): Promise<number> => {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('[bounces] No SENDGRID_API_KEY set, skipping');
    return 0;
  }

  const emails = await fetchBouncedEmails();
  const count = await markBounced(emails);

  console.log(
    `[bounces] ${emails.length} suppressed addresses, ${count} subscriber(s) newly flagged`
  );

  return count;
};
