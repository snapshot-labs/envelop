import { getFollows, getProposal } from '../../../../src/helpers/snapshot';
import { getVerifiedSubscriptions } from '../../../../src/helpers/utils';
import { mailerQueue } from '../../../../src/queues';
import proposalFactoryProcessor from '../../../../src/queues/processors/proposalFactory';
import { proposals } from '../../../fixtures/proposals';

jest.mock('../../../../src/helpers/snapshot', () => ({
  ...jest.requireActual('../../../../src/helpers/snapshot'),
  getProposal: jest.fn(),
  getFollows: jest.fn()
}));

jest.mock('../../../../src/helpers/utils', () => ({
  getVerifiedSubscriptions: jest.fn()
}));

jest.mock('../../../../src/queues', () => ({
  mailerQueue: { addBulk: jest.fn() }
}));

const eligible = { ...proposals[0], end: Math.floor(Date.now() / 1e3) + 86400 };
const job = { data: { event: 'created', id: eligible.id } } as any;

describe('proposalFactory processor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getFollows as jest.Mock).mockResolvedValue([{ follower: '0xabc' }]);
    (getVerifiedSubscriptions as jest.Mock).mockResolvedValue([
      { address: '0xabc', email: 'subscriber@test.com' }
    ]);
  });

  it('enqueues an email when the proposal is eligible', async () => {
    (getProposal as jest.Mock).mockResolvedValue(eligible);

    expect(await proposalFactoryProcessor(job)).toBe(1);
    expect(mailerQueue.addBulk).toHaveBeenCalled();
  });

  it('enqueues nothing when the space is flagged', async () => {
    (getProposal as jest.Mock).mockResolvedValue({
      ...eligible,
      space: { ...eligible.space, flagged: true }
    });

    expect(await proposalFactoryProcessor(job)).toBe(0);
    expect(mailerQueue.addBulk).not.toHaveBeenCalled();
  });
});
