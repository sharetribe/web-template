import { configIssue, isPlainObject } from './config.shared';

describe('config.shared', () => {
  describe('isPlainObject', () => {
    it('accepts plain objects', () => {
      expect(isPlainObject({})).toBe(true);
      expect(isPlainObject({ a: 1 })).toBe(true);
    });

    it('rejects arrays and non-objects', () => {
      expect(isPlainObject([])).toBe(false);
      expect(isPlainObject(null)).toBe(false);
      expect(isPlainObject('x')).toBe(false);
    });
  });

  describe('configIssue', () => {
    it('returns a structured issue', () => {
      expect(
        configIssue({ level: 'warn', code: 'TEST', message: 'Something went wrong.' })
      ).toEqual({
        level: 'warn',
        code: 'TEST',
        message: 'Something went wrong.',
      });
    });
  });
});
