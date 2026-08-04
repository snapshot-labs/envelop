import { getProposal } from '../../../src/helpers/snapshot';
import buildMessage from '../../../src/templates/builder';
import prepareNewProposal from '../../../src/templates/newProposal';

jest.mock('../../../src/helpers/snapshot', () => ({
  getProposal: jest.fn()
}));

jest.mock('../../../src/templates/builder', () => ({
  __esModule: true,
  default: jest.fn()
}));

describe('newProposal template', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    ['missing', null],
    ['unverified', { space: { verified: false }, flagged: false }],
    ['flagged', { space: { verified: true }, flagged: true }]
  ])('skips when the proposal is %s', async (_state, proposal) => {
    (getProposal as jest.Mock).mockResolvedValue(proposal);

    const result = await prepareNewProposal({ id: 'proposal-id' });

    expect(result).toEqual({});
    expect(buildMessage).not.toHaveBeenCalled();
  });
});
