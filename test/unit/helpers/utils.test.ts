import { isValidEmail, sanitizeSubscriptions } from '../../../src/helpers/utils';

describe('utils', () => {
  describe('isvalidEmail', () => {
    it.each([
      'valid@example.com',
      'Valid@test.example.com',
      'valid+valid123@test.example.com',
      'valid_valid123@test.example.com',
      'valid-valid+123@test.example.co.uk',
      'valid-valid+1.23@test.example.com.au',
      'valid@1example.com',
      'valid@example.co.uk',
      'v@example.com',
      'valid@example.ca',
      'valid_@example.com',
      'valid123.456@example.org',
      'valid123.456@example.travel',
      'valid123.456@example.museum',
      'valid@example.mobi',
      'valid@example.info',
      'valid-@example.com',
      'fake@p-t.k12.ok.us'
      // allow single character domain parts
      // 'valid@mail.x.example.com',
      // 'valid@x.com',
      // 'valid@example.w-dash.sch.uk',
      // from RFC 3696, page 6
      // 'customer/department=shipping@example.com',
      // '$A12345@example.com',
      // '!def!xyz%abc@example.com',
      // '_somename@example.com',
      // // apostrophes
      // "test'test@example.com",
      // // international domain names
      // 'test@xn--bcher-kva.ch',
      // 'test@example.xn--0zwm56d',
      // 'test@192.192.192.1',
      // // Allow quoted characters.  Valid according to http://www.rfc-editor.org/errata_search.php?rfc=3696
      // '"Abc@def"@example.com',
      // '"quote".dotatom."otherquote"@example.com',
      // '"Quote(Only".Chars@wier.de',
      // '"much.more unusual"@example.com',
      // '"very.unusual.@.unusual.com"@example.com',
      // '"very.(),:;<>[]".VERY."very@\\ "very".unusual"@strange.example.com',
      // '"()<>[]:,;@"!#$%&*+-/=?^_`{}| ~  ? ^_`{}|~.a"@example.org',
      // '"Fred Bloggs"@example.com',
      // '"Joe.\\Blow"@example.com',
      // // Balanced quoted characters
      // '"example\\\\\\""@example.com',
      // '"example\\\\"@example.com',
      // '(leading comment)email@example.com',
      // '(nested (comment))email@example.com',
      // 'email(trailing comment)@example.com'
    ])('returns true on valid email %s', email => {
      expect(isValidEmail(email)).toBe(true);
    });

    it.each([
      'no_at_symbol',
      'multiple@at@symbols.com',
      'invalid@example-com',
      // period can not start local part
      '.invalid@example.com',
      // period can not end local part
      'invalid.@example.com',
      // period can not appear twice consecutively in local part
      'invali..d@example.com',
      // should not allow underscores in domain names
      'invalid@ex_mple.com',
      'invalid@e..example.com',
      'invalid@p-t..example.com',
      'invalid@example.com.',
      'invalid@example.com_',
      'invalid@example.com-',
      'invalid-example.com',
      'invalid@example.b#r.com',
      'just"not"right@example.com',
      // 'invalid@example.c',
      'invali d@example.com',
      // TLD can not be only numeric
      // 'invalid@example.123',
      // unclosed quote
      '"a-17180061943-10618354-1993365053@example.com',
      // too many special chars used to cause the regexp to hang
      '-+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++@foo',
      'invalidexample.com',
      // should not allow special chars after a period in the domain
      'local@sub.)domain.com',
      'local@sub.#domain.com',
      // one at a time
      'foo@example.com\nexample@gmail.com',
      'invalid@example.',
      '"foo\\\\""@bar.com',
      'foo@mail.com\r\nfoo@mail.com',
      '@example.com',
      'foo@',
      'foo',
      'Iñtërnâtiônàlizætiøn@hasnt.happened.to.email',
      // Escaped characters with quotes.  From http://tools.ietf.org/html/rfc3696, page 5.  Corrected in http://www.rfc-editor.org/errata_search.php?rfc=3696
      'Fred Bloggs_@example.com',
      'Abc@def+@example.com',
      'Joe.\\Blow@example.com'
      // // Unbalanced quoted characters
      // '"example\\\\""example.com',
      // '\nnewline@example.com',
      // ' spacesbefore@example.com',
      // 'spacesafter@example.com ',
      // '(unbalancedcomment@example.com'
    ])('returns false on invalid email %s', email => {
      expect(isValidEmail(email)).toBe(false);
    });
  });

  describe('sanitizeSubscriptions()', () => {
    it('filters out invalid types', () => {
      expect(sanitizeSubscriptions(['summary', 'test'])).toEqual(['summary']);
    });

    it('also takes a string as argument', () => {
      expect(sanitizeSubscriptions('summary')).toEqual(['summary']);
    });

    it('always returns an array', () => {
      expect(sanitizeSubscriptions([])).toEqual([]);
      expect(sanitizeSubscriptions(['invalid'])).toEqual([]);
    });
  });
});
