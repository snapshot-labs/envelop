import { fetchBouncedEmails } from '../../../src/helpers/sendgrid';

const PAGE_SIZE = 500;
const mockFetch = jest.fn();

function page(size: number, prefix: string) {
  return Array.from({ length: size }, (_, index) => ({
    email: `${prefix}-${index}@test.com`,
    created: 1700000000,
    reason: '550 unknown recipient',
    status: '5.1.1'
  }));
}

function respond(body: any, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body
  };
}

describe('sendgrid', () => {
  const apiKey = process.env.SENDGRID_API_KEY;

  beforeAll(() => {
    global.fetch = mockFetch as any;
    process.env.SENDGRID_API_KEY = 'SG.test-key';
  });

  // clearMocks leaves queued one-time responses behind, which would let a test
  // that stops early hand its leftovers to the next one.
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterAll(() => {
    process.env.SENDGRID_API_KEY = apiKey;
  });

  describe('fetchBouncedEmails()', () => {
    it('requests the suppression list with the api key', async () => {
      mockFetch.mockResolvedValueOnce(respond([]));

      await fetchBouncedEmails();

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe(
        'https://api.sendgrid.com/v3/suppression/bounces?limit=500&offset=0'
      );
      expect(options.headers.Authorization).toBe('Bearer SG.test-key');
    });

    it('returns every address across all pages', async () => {
      mockFetch
        .mockResolvedValueOnce(respond(page(PAGE_SIZE, 'first')))
        .mockResolvedValueOnce(respond(page(PAGE_SIZE, 'second')))
        .mockResolvedValueOnce(respond(page(2, 'last')));

      const emails = await fetchBouncedEmails();

      expect(emails).toHaveLength(PAGE_SIZE * 2 + 2);
      expect(emails[0]).toBe('first-0@test.com');
      expect(emails.at(-1)).toBe('last-1@test.com');
      expect(mockFetch.mock.calls.map(call => call[0])).toEqual([
        expect.stringContaining('offset=0'),
        expect.stringContaining('offset=500'),
        expect.stringContaining('offset=1000')
      ]);
    });

    it('stops on the first short page', async () => {
      mockFetch.mockResolvedValueOnce(respond(page(1, 'only')));

      expect(await fetchBouncedEmails()).toEqual(['only-0@test.com']);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it.each([401, 403])(
      'names the missing scope when the key can not read suppressions (%s)',
      async status => {
        mockFetch.mockResolvedValueOnce(respond({}, status));

        await expect(fetchBouncedEmails()).rejects.toThrow(
          /Suppressions scope/
        );
      }
    );

    it('throws on any other error status', async () => {
      mockFetch.mockResolvedValueOnce(respond({}, 500));

      await expect(fetchBouncedEmails()).rejects.toThrow('status 500');
    });
  });
});
