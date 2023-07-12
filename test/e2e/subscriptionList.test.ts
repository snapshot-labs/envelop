import request from 'supertest';
import templates from '../../src/templates';
import type { TemplateId } from '../../types';

function subscriptionListFormat(key: TemplateId) {
  return {
    name: templates[key].name,
    description: templates[key].description
  };
}

describe('GET subscriptionList', () => {
  it('returns a list of subscriptions type', async () => {
    const response = await request(process.env.HOST).get('/subscriptionsList');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      summary: subscriptionListFormat('summary'),
      newProposal: subscriptionListFormat('newProposal'),
      closedProposal: subscriptionListFormat('closedProposal')
    });
  });
});
