import {pickFieldOptions } from './PageBuilder.helpers';


  describe('pickFieldOptions()', () => {
    it('returns an empty object when options are empty', () => {
      expect(pickFieldOptions()).toEqual({});
      expect(pickFieldOptions({})).toEqual({});
    });
  });
});
