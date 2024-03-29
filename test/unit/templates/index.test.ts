import buildMessage from '../../../src/templates/builder';
import { unsubscribeLink, updateSubscriptionsLink } from '../../../src/templates/utils';

describe('templates', () => {
  const email = 'test@test.com';

  it('injects an unsubscribe link in the email', async () => {
    const link = await unsubscribeLink(email);
    const result = await buildMessage('summary', { to: email });
    const escapedLink = link.replace(/&/g, '&amp;').replace(/=/g, '&#x3D;');

    expect(result.text).toContain(link);
    expect(result.html).toContain(escapedLink);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(result.headers!['List-Unsubscribe']).toEqual(`<${link}>`);
  });

  it('injects an update subscriptions link in the email', async () => {
    const link = await updateSubscriptionsLink(email);
    const result = await buildMessage('summary', { to: email });
    const escapedLink = link.replace(/&/g, '&amp;').replace(/=/g, '&#x3D;');

    expect(result.text).toContain(link);
    expect(result.html).toContain(escapedLink);
  });

  it('creates a valid unsubscribe link', async () => {
    const link = new URL((await unsubscribeLink(email)).replace('#/', ''));

    expect(link.origin).toBe(process.env.FRONT_HOST);
    expect(link.searchParams.get('signature')).toMatch(/^0x[a-f0-9]{130}$/gi);
    expect(link.searchParams.get('email')).toBe(email);
  });

  it('creates a valid update subscriptions link', async () => {
    const link = new URL((await updateSubscriptionsLink(email)).replace('#/', ''));

    expect(link.origin).toBe(process.env.FRONT_HOST);
    expect(link.searchParams.get('signature')).toMatch(/^0x[a-f0-9]{130}$/gi);
    expect(link.searchParams.get('email')).toBe(email);
  });
});
