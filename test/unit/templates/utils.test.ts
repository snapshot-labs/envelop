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
  });
});
