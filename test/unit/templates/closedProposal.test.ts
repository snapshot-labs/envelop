import { getProposal } from '../../../src/helpers/snapshot';
import buildMessage from '../../../src/templates/builder';
import prepareClosedProposal from '../../../src/templates/closedProposal';
import { proposals } from '../../fixtures/proposals';

jest.mock('../../../src/helpers/snapshot', () => ({
  ...jest.requireActual('../../../src/helpers/snapshot'),
  getProposal: jest.fn()
}));

jest.mock('../../../src/templates/builder', () => ({
  __esModule: true,
  default: jest.fn()
}));

const eligible = {
  ...proposals[4],
  choices: ['For', 'Against'],
  scores: [2, 1],
  scores_total: 3,
  votes: 3
};

describe('closedProposal template', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('builds a message when the proposal is eligible', async () => {
    (getProposal as jest.Mock).mockResolvedValue({ ...eligible });

    await prepareClosedProposal({ id: eligible.id });

    expect(buildMessage).toHaveBeenCalled();
  });

  it.each([
    ['missing', null],
    ['flagged', { ...eligible, flagged: true }],
    [
      'in an unverified space',
      { ...eligible, space: { ...eligible.space, verified: false } }
    ],
    [
      'in a flagged space',
      { ...eligible, space: { ...eligible.space, flagged: true } }
    ]
  ])('skips when the proposal is %s', async (_state, proposal) => {
    (getProposal as jest.Mock).mockResolvedValue(proposal);

    const result = await prepareClosedProposal({ id: 'proposal-id' });

    expect(result).toEqual({});
    expect(buildMessage).not.toHaveBeenCalled();
  });
});
