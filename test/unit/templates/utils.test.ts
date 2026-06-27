import {
  linkWithTracker,
  truncateProposalBody
} from '../../../src/templates/utils';

describe('utils', () => {
  describe('truncateProposalBody', () => {
    it('cuts at the nearest word boundary before max length', () => {
      expect(
        truncateProposalBody(
          'This proposal keeps complete words near the limit',
          36
        )
      ).toEqual({
        body: 'This proposal keeps complete words',
        isTruncated: true
      });
    });

    it('uses the last word boundary before max length', () => {
      expect(
        truncateProposalBody(
          'This proposal should keep as much readable text as possible',
          46
        )
      ).toEqual({
        body: 'This proposal should keep as much readable',
        isTruncated: true
      });
    });

    it('preserves leading whitespace while trimming the cut boundary', () => {
      expect(
        truncateProposalBody('  Leading whitespace is preserved here', 25)
      ).toEqual({
        body: '  Leading whitespace is',
        isTruncated: true
      });
    });

    it('does not truncate short proposal bodies', () => {
      expect(truncateProposalBody('Short body', 20)).toEqual({
        body: 'Short body',
        isTruncated: false
      });
    });

    it('trims trailing whitespace without marking the body as truncated', () => {
      expect(truncateProposalBody('Short body     ', 10)).toEqual({
        body: 'Short body',
        isTruncated: false
      });
    });

    it('returns an empty non-truncated excerpt for whitespace-only bodies', () => {
      expect(truncateProposalBody('          ', 5)).toEqual({
        body: '',
        isTruncated: false
      });
    });
  });

  describe('linkWithTracker', () => {
    describe('when the link does not have any query params', () => {
      it('appends the tracker query params', () => {
        expect(linkWithTracker('https://snapshot.box/test')).toEqual(
          'https://snapshot.box/test?app=envelop'
        );
      });
    });

    describe('with a vuejs link with hash', () => {
      it('appends the tracker query params', () => {
        expect(
          linkWithTracker('https://snapshot.box/#/proposal/some-id')
        ).toEqual('https://snapshot.box/#/proposal/some-id?app=envelop');
      });
    });

    describe('with a vuejs link with hash and query params', () => {
      it('appends the tracker query params', () => {
        expect(
          linkWithTracker('https://snapshot.box/#/proposal/some-id?test=a')
        ).toEqual('https://snapshot.box/#/proposal/some-id?test=a&app=envelop');
      });
    });

    describe('when the tracker link already exists', () => {
      it('does not append the tracker link', () => {
        expect(
          linkWithTracker('https://snapshot.box/#/proposal/some-id?app=envelop')
        ).toEqual('https://snapshot.box/#/proposal/some-id?app=envelop');
      });
    });
  });
});
