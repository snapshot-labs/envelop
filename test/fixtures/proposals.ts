import type { Proposal, Vote } from '../../src/helpers/snapshot';

export const proposals: Proposal[] = [
  {
    id: '0x1',
    body: '[click here](https://link.com/) for some pretty awesome *content*',
    title: 'shutter 1',
    start: 1678243302,
    end: 1678243620,
    state: 'active',
    link: 'https://snapshot.org/#/spaceone.eth/proposal/0xda05f86b3d7305e5a31b9f23a02c3625edcae5e73ac717a99fa2bf36bcdd0144',
    space: { id: 'spaceone.eth', name: 'TestDAO', verified: true }
  },
  {
    id: '0x2',
    body: 'click here for some pretty awesome content',
    title: 'shutter 1',
    start: 1678243302,
    end: 1678243620,
    state: 'active',
    link: 'https://snapshot.org/#/spaceone.eth/proposal/0xda05f86b3d7305e5a31b9f23a02c3625edcae5e73ac717a99fa2bf36bcdd0144',
    space: { id: 'spaceone.eth', name: 'TestDAO', verified: true }
  },
  {
    id: '0x3',
    body: 'test',
    title: 'shutter 1',
    start: 1678243302,
    end: 1678243620,
    state: 'active',
    link: 'https://snapshot.org/#/spacetwo.eth/proposal/0xda05f86b3d7305e5a31b9f23a02c3625edcae5e73ac717a99fa2bf36bcdd0144',
    space: { id: 'spacetwo.eth', name: 'TestDAO', verified: true }
  },
  {
    id: '0x4',
    body: 'test',
    title: 'shutter 1',
    start: 1678243302,
    end: 1678243620,
    state: 'pending',
    link: 'https://snapshot.org/#/testsnap.eth/proposal/0xda05f86b3d7305e5a31b9f23a02c3625edcae5e73ac717a99fa2bf36bcdd0144',
    space: { id: 'testsnap.eth', name: 'TestDAO', verified: true }
  },
  {
    id: '0x5',
    body: 'test',
    title: 'shutter 1',
    start: 1678243302,
    end: 1678243620,
    state: 'closed',
    link: 'https://snapshot.org/#/testsnap.eth/proposal/0xda05f86b3d7305e5a31b9f23a02c3625edcae5e73ac717a99fa2bf36bcdd0144',
    space: { id: 'testsnap.eth', name: 'TestDAO', verified: true }
  }
];

export const votes: Vote[] = [
  { id: '1', proposal: { id: '0x2' } },
  { id: '2', proposal: { id: '0x4' } }
];

export const expectedProposalsByStatus = {
  active: [proposals[0].id, proposals[1].id, proposals[2].id],
  pending: [proposals[3].id],
  closed: [proposals[4].id]
};

export const expectedProposalsBySpace = {
  active: [
    { space: proposals[0].space.id, proposals: [proposals[0].id, proposals[1].id] },
    { space: proposals[2].space.id, proposals: [proposals[2].id] }
  ],
  pending: [{ space: proposals[3].space.id, proposals: [proposals[3].id] }],
  closed: [{ space: proposals[4].space.id, proposals: [proposals[4].id] }]
};

export const expectedShortBody = [
  { length: 10, id: '0x2', shortBody: 'click here…' },
  { length: 100, id: '0x2', shortBody: proposals[1].body }
];

export const expectedSanitazedShortBody = [
  { id: '0x1', shortBody: 'click here for some pretty awesome content' }
];

export const expectedVotedProposals = ['0x2', '0x4'];
