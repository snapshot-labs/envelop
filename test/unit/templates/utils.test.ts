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

    describe('when the link have some query params', () => {
      it('appends the tracker query params', () => {
        expect(linkWithTracker('https://snapshot.org/test/?page=1')).toEqual(
          'https://snapshot.org/test/?page=1&app=envelop'
        );
      });
    });

    describe('when the link have a query params with the same name', () => {
      it('overwrite the tracker query params', () => {
        expect(linkWithTracker('https://snapshot.org/test/?app=test')).toEqual(
          'https://snapshot.org/test/?app=envelop'
        );
      });
    });
  });
});
