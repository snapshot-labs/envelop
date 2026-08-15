import { countSentEmails } from '../../../src/helpers/metrics';
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
  countSentEmails: { inc: jest.fn() }
}));

describe('mailer queue completed handler', () => {
  let onCompleted: (job: any, result: unknown) => void;

  beforeAll(async () => {
    await import('../../../src/queues');

    onCompleted = mockQueues.mailer.on.mock.calls.find(
      (call: any[]) => call[0] === 'completed'
    )[1];
  });

  it('counts a job that sent an email', () => {
    // processors resolve with the result of helpers/mail send(), which is void
    onCompleted({ name: 'newProposal' }, undefined);

    expect(countSentEmails.inc).toHaveBeenCalledWith({ type: 'newProposal' });
  });

  it('does not count a job that was skipped', () => {
    onCompleted({ name: 'newProposal' }, SKIPPED);

    expect(countSentEmails.inc).not.toHaveBeenCalled();
  });
});
