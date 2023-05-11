import request from 'supertest';
import templates from '../../src/templates';

describe('GET subscriptionList', () => {
  it('returns a list of subscriptions type', async () => {
    const response = await request(process.env.HOST).get('/subscriptionsList');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      summary: { name: templates.summary.name, description: templates.summary.description },
      newProposal: {
        name: templates.newProposal.name,
        description: templates.newProposal.description
      },
      closedProposal: {
        name: templates.closedProposal.name,
        description: templates.closedProposal.description
      }
    });
  });
});
