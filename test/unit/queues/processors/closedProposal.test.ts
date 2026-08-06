import { send } from '../../../../src/helpers/mail';
import closedProposalProcessor from '../../../../src/queues/processors/closedProposal';
import templates from '../../../../src/templates';

jest.mock('../../../../src/helpers/mail', () => ({
  send: jest.fn()
}));

jest.mock('../../../../src/templates', () => ({
  __esModule: true,
  default: {
    closedProposal: {
      prepare: jest.fn()
    }
  }
}));

const job = {
  data: { email: 'test@example.com', id: 'proposal-id' }
} as any;

describe('closedProposal processor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends the email when the proposal is eligible', async () => {
    const msg = { to: 'test@example.com', subject: 'Closed proposal' };
    (templates.closedProposal.prepare as jest.Mock).mockResolvedValue(msg);

    await closedProposalProcessor(job);

    expect(send).toHaveBeenCalledWith(msg);
  });

  it('skips proposals that are no longer eligible', async () => {
    (templates.closedProposal.prepare as jest.Mock).mockResolvedValue({});

    expect(await closedProposalProcessor(job)).toBe('Skipped');
    expect(send).not.toHaveBeenCalled();
  });
});
