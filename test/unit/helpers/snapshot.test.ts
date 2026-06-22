// Ensures the Apollo hub client uses the global (native, undici-backed)
// `fetch` rather than the removed `node-fetch` + keep-alive agent proxy.
// See snapshot-labs/envelop#291 (hub ECONNRESET from stale keep-alive sockets).
describe('helpers/snapshot', () => {
  const realFetch = globalThis.fetch;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ data: { proposal: { id: '0x1', title: 'hello' } } }),
      json: async () => ({ data: { proposal: { id: '0x1', title: 'hello' } } }),
      headers: new Headers({ 'content-type': 'application/json' })
    }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    jest.resetModules();
  });

  afterEach(() => {
    globalThis.fetch = realFetch;
    jest.clearAllMocks();
  });

  // The client binds `fetch` at module-load time, so the module is imported
  // after the global is mocked.
  async function loadSnapshot() {
    let mod!: typeof import('../../../src/helpers/snapshot');
    await jest.isolateModulesAsync(async () => {
      mod = await import('../../../src/helpers/snapshot');
    });
    return mod;
  }

  it('queries the hub through the global native fetch', async () => {
    const { getProposal } = await loadSnapshot();
    const proposal = await getProposal('0x1');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(proposal).toEqual({ id: '0x1', title: 'hello' });
  });

  it('does not pass a node-fetch `agent` option to fetch', async () => {
    const { getProposal } = await loadSnapshot();
    await getProposal('0x1');

    const [, options] = fetchMock.mock.calls[0];
    expect(options).toBeDefined();
    expect(options).not.toHaveProperty('agent');
  });
});
