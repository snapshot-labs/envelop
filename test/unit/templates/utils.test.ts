import { linkWithTracker } from '../../../src/templates/utils';

describe('utils', () => {
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
        expect(linkWithTracker('https://snapshot.box/#/proposal/some-id')).toEqual(
          'https://snapshot.box/#/proposal/some-id?app=envelop'
        );
      });
    });

    describe('with a vuejs link with hash and query params', () => {
      it('appends the tracker query params', () => {
        expect(linkWithTracker('https://snapshot.box/#/proposal/some-id?test=a')).toEqual(
          'https://snapshot.box/#/proposal/some-id?test=a&app=envelop'
        );
      });
    });

    describe('when the tracker link already exists', () => {
      it('does not append the tracker link', () => {
        expect(linkWithTracker('https://snapshot.box/#/proposal/some-id?app=envelop')).toEqual(
          'https://snapshot.box/#/proposal/some-id?app=envelop'
        );
      });
    });
  });
});
