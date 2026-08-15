import { getFollows, getProposal } from '../../../../src/helpers/snapshot';
import { getVerifiedSubscriptions } from '../../../../src/helpers/utils';
import { mailerQueue, queueProposalFanOut } from '../../../../src/queues';
import proposalFactoryProcessor from '../../../../src/queues/processors/proposalFactory';
import { MAX_PROPOSAL_DELAY } from '../../../../src/queues/utils';
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
  mailerQueue: { addBulk: jest.fn() },
  queueProposalFanOut: jest.fn()
}));

const eligible = { ...proposals[0], end: Math.floor(Date.now() / 1e3) + 86400 };
const email = 'subscriber@test.com';
const job = { data: { event: 'created', id: eligible.id } } as any;
const dueJob = {
  data: { event: 'created', id: eligible.id, fanOut: true }
} as any;
const closedJob = { data: { event: 'end', id: eligible.id } } as any;

function subscribed(addresses: string[]) {
  (getVerifiedSubscriptions as jest.Mock).mockResolvedValue(
    addresses.map(address => ({ address, email }))
  );
  (getFollows as jest.Mock).mockResolvedValue(
    addresses.map(address => ({ follower: address }))
  );
}

describe('proposalFactory processor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    subscribed(['0xabc']);
  });

  it('schedules the fan-out when a new proposal is eligible', async () => {
    (getProposal as jest.Mock).mockResolvedValue(eligible);

    expect(await proposalFactoryProcessor(job)).toBe(0);
    expect(queueProposalFanOut).toHaveBeenCalledWith(
      'created',
      eligible.id,
      MAX_PROPOSAL_DELAY
    );
    expect(getVerifiedSubscriptions).not.toHaveBeenCalled();
    expect(mailerQueue.addBulk).not.toHaveBeenCalled();
  });

  it('enqueues an email when the fan-out is due', async () => {
    (getProposal as jest.Mock).mockResolvedValue(eligible);

    expect(await proposalFactoryProcessor(dueJob)).toBe(1);
    expect(queueProposalFanOut).not.toHaveBeenCalled();
    expect(mailerQueue.addBulk).toHaveBeenCalledWith([
      {
        name: 'newProposal',
        data: { email, id: eligible.id },
        opts: { jobId: `newProposal-${email}-${eligible.id}` }
      }
    ]);
  });

  it('does not email an address that unsubscribed before the mail was due', async () => {
    (getProposal as jest.Mock).mockResolvedValue(eligible);

    await proposalFactoryProcessor(job);

    expect(mailerQueue.addBulk).not.toHaveBeenCalled();

    subscribed([]);

    expect(await proposalFactoryProcessor(dueJob)).toBe(0);
    expect(mailerQueue.addBulk).toHaveBeenCalledWith([]);
  });

  it('emails an address that subscribed before the mail was due', async () => {
    (getProposal as jest.Mock).mockResolvedValue(eligible);
    subscribed([]);

    await proposalFactoryProcessor(job);

    expect(mailerQueue.addBulk).not.toHaveBeenCalled();

    subscribed(['0xabc']);

    expect(await proposalFactoryProcessor(dueJob)).toBe(1);
  });

  it('enqueues a closed proposal email without waiting', async () => {
    (getProposal as jest.Mock).mockResolvedValue(eligible);

    expect(await proposalFactoryProcessor(closedJob)).toBe(1);
    expect(queueProposalFanOut).not.toHaveBeenCalled();
    expect(mailerQueue.addBulk).toHaveBeenCalledWith([
      {
        name: 'closedProposal',
        data: { email, id: eligible.id },
        opts: { jobId: `closedProposal-${email}-${eligible.id}` }
      }
    ]);
  });

  it('enqueues nothing when the space is flagged', async () => {
    (getProposal as jest.Mock).mockResolvedValue({
      ...eligible,
      space: { ...eligible.space, flagged: true }
    });

    expect(await proposalFactoryProcessor(job)).toBe(0);
    expect(queueProposalFanOut).not.toHaveBeenCalled();
    expect(mailerQueue.addBulk).not.toHaveBeenCalled();
  });

  it('enqueues nothing when the fan-out is due and the space is flagged', async () => {
    (getProposal as jest.Mock).mockResolvedValue({
      ...eligible,
      space: { ...eligible.space, flagged: true }
    });

    expect(await proposalFactoryProcessor(dueJob)).toBe(0);
    expect(mailerQueue.addBulk).not.toHaveBeenCalled();
  });
});
