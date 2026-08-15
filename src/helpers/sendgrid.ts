const BOUNCES_URL = 'https://api.sendgrid.com/v3/suppression/bounces';

// SendGrid caps a page of suppressions at 500.
const PAGE_SIZE = 500;

// The list is walked until a short page ends it. This bounds the walk in case
// a response ignores the offset, rather than paging forever.
const MAX_PAGES = 400;

type Bounce = {
  email: string;
  created: number;
  reason: string;
  status: string;
};

async function fetchPage(offset: number): Promise<Bounce[]> {
  const params = new URLSearchParams({
    limit: PAGE_SIZE.toString(),
    offset: offset.toString()
  });

  const response = await fetch(`${BOUNCES_URL}?${params}`, {
    headers: {
      Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
      Accept: 'application/json'
    }
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error(
      'SENDGRID_API_KEY can not read suppressions. Give the key the Suppressions scope to let bounces be ingested.'
    );
  }

  if (!response.ok) {
    throw new Error(
      `SendGrid bounces request failed with status ${response.status}`
    );
  }

  return response.json();
}

/**
 * Every address on the SendGrid bounce suppression list, not just the ones
 * added since the last run. SendGrid drops mail to a suppressed address
 * silently instead of bouncing it again, so an address missed once would never
 * be reported again.
 */
export async function fetchBouncedEmails() {
  const emails: string[] = [];

  for (let page = 0; page < MAX_PAGES; page++) {
    const bounces = await fetchPage(page * PAGE_SIZE);

    emails.push(...bounces.map(bounce => bounce.email));

    if (bounces.length < PAGE_SIZE) {
      return emails;
    }
  }

  console.log(
    `[sendgrid] Stopped reading bounces after ${MAX_PAGES} pages, some may be missing`
  );

  return emails;
}
