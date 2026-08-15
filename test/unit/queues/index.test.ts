import {
  countSentEmails,
  countSkippedEmails
} from '../../../src/helpers/metrics';
import { SKIPPED } from '../../../src/queues/utils';

const mockQueues: Record<string, any> = {};

jest.mock('bull', () =>
  jest.fn().mockImplementation((name: string) => {
    const queue = {
      name,
      on: jest.fn(),
      process: jest.fn(),
      add: jest.fn(),
      addBulk: jest.fn(),
      close: jest.fn(),
      count: jest.fn()
    };
    mockQueues[name] = queue;
    return queue;
  })
);

jest.mock('ioredis', () =>
  jest.fn().mockImplementation(() => ({ on: jest.fn() }))
);

jest.mock('../../../src/helpers/metrics', () => ({
  countSentEmails: { inc: jest.fn() },
  countSkippedEmails: { inc: jest.fn() }
}));

// Both are read before the first test runs, as clearMocks wipes the calls
// made while src/queues was being evaluated.
let queueProposalFanOut: (event: string, id: string, delay: number) => unknown;
let onCompleted: (job: any, result: unknown) => void;

beforeAll(async () => {
  ({ queueProposalFanOut } = await import('../../../src/queues'));

  onCompleted = mockQueues.mailer.on.mock.calls.find(
    (call: any[]) => call[0] === 'completed'
  )[1];
});

describe('queueProposalFanOut', () => {
  it('schedules a single delayed fan-out job', () => {
    queueProposalFanOut('created', '0x1', 7200000);

    expect(mockQueues['proposal-activities'].add).toHaveBeenCalledWith(
      'proposalFactory',
      { event: 'created', id: '0x1', fanOut: true },
      { jobId: 'proposalFanOut-created-0x1', delay: 7200000 }
    );
  });
});

describe('mailer queue completed handler', () => {
  it('counts a job that sent an email', () => {
    // processors resolve with the result of helpers/mail send(), which is void
    onCompleted({ name: 'newProposal' }, undefined);

    expect(countSentEmails.inc).toHaveBeenCalledWith({ type: 'newProposal' });
    expect(countSkippedEmails.inc).not.toHaveBeenCalled();
  });

  it('does not count a job that was skipped', () => {
    onCompleted({ name: 'newProposal' }, SKIPPED);

    expect(countSentEmails.inc).not.toHaveBeenCalled();
  });

  it('counts a job that was skipped', () => {
    onCompleted({ name: 'closedProposal' }, SKIPPED);

    expect(countSkippedEmails.inc).toHaveBeenCalledWith({
      type: 'closedProposal'
    });
  });
});
