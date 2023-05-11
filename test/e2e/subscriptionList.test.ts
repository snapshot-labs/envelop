import request from 'supertest';

describe('GET subscriptionList', () => {
  it('returns a list of subscriptions type', async () => {
    const response = await request(process.env.HOST).get('/subscriptionsList');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(['summary', 'newProposal', 'closedProposal']);
  });
});
