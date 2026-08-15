import { fetchBouncedEmails } from '../../../../src/helpers/sendgrid';
import { markBounced } from '../../../../src/helpers/utils';
import bouncesProcessor from '../../../../src/queues/processors/bounces';

jest.mock('../../../../src/helpers/sendgrid', () => ({
  fetchBouncedEmails: jest.fn()
}));

jest.mock('../../../../src/helpers/utils', () => ({
  markBounced: jest.fn()
}));

describe('bounces processor', () => {
  const apiKey = process.env.SENDGRID_API_KEY;

  afterAll(() => {
    process.env.SENDGRID_API_KEY = apiKey;
  });

  it('flags every suppressed address', async () => {
    process.env.SENDGRID_API_KEY = 'SG.test-key';
    (fetchBouncedEmails as jest.Mock).mockResolvedValue([
      'gone@test.com',
      'also-gone@test.com'
    ]);
    (markBounced as jest.Mock).mockResolvedValue(2);

    expect(await bouncesProcessor()).toBe(2);
    expect(markBounced).toHaveBeenCalledWith([
      'gone@test.com',
      'also-gone@test.com'
    ]);
  });

  it('does nothing when no api key is configured', async () => {
    delete process.env.SENDGRID_API_KEY;

    expect(await bouncesProcessor()).toBe(0);
    expect(fetchBouncedEmails).not.toHaveBeenCalled();
    expect(markBounced).not.toHaveBeenCalled();
  });
});
