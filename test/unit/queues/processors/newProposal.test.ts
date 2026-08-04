import { send } from '../../../../src/helpers/mail';
import newProposalProcessor from '../../../../src/queues/processors/newProposal';
import templates from '../../../../src/templates';

jest.mock('../../../../src/helpers/mail', () => ({
  send: jest.fn()
}));

jest.mock('../../../../src/templates', () => ({
  __esModule: true,
  default: {
    newProposal: {
      prepare: jest.fn()
    }
  }
}));

describe('newProposal processor', () => {
  it('skips proposals that are no longer eligible', async () => {
    (templates.newProposal.prepare as jest.Mock).mockResolvedValue({});

    const result = await newProposalProcessor({
      data: { email: 'test@example.com', id: 'proposal-id' }
    } as any);

    expect(result).toBe('Skipped');
    expect(send).not.toHaveBeenCalled();
  });
});
