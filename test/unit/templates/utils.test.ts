import { linkWithTracker } from '../../../src/templates/utils';

describe('utils', () => {
  describe('linkWithTracker', () => {
    describe('when the link does not have any query params', () => {
      it('appends the tracker query params', () => {
        expect(linkWithTracker('https://snapshot.org/test')).toEqual(
          'https://snapshot.org/test?app=envelop'
        );
      });
    });

    describe('with a vuejs link with hash', () => {
      it('appends the tracker query params', () => {
        expect(linkWithTracker('https://snapshot.org/#/proposal/some-id')).toEqual(
          'https://snapshot.org/#/proposal/some-id?app=envelop'
        );
      });
    });

    describe('with a vuejs link with hash and query params', () => {
      it('appends the tracker query params', () => {
        expect(linkWithTracker('https://snapshot.org/#/proposal/some-id?test=a')).toEqual(
          'https://snapshot.org/#/proposal/some-id?test=a&app=envelop'
        );
      });
    });
  });
});
