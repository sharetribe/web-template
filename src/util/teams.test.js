import {
  TEAM_USER_TYPE,
  INDIVIDUAL_USER_TYPE,
  getUserTypeId,
  isTeamAccount,
  isIndividualAccount,
  getTeamCode,
  getJoinedTeamCodes,
  normalizeTeamCode,
  isValidTeamCodeFormat,
  formatTeamCode,
  generateTeamCode,
  addTeamCode,
  removeTeamCode,
} from './teams';

// Build a minimal currentUser-like entity.
const userWith = publicData => ({ attributes: { profile: { publicData } } });

describe('teams util', () => {
  describe('account type helpers', () => {
    it('reads the userType id', () => {
      expect(getUserTypeId(userWith({ userType: TEAM_USER_TYPE }))).toEqual('teamname');
      expect(getUserTypeId(undefined)).toBeUndefined();
      expect(getUserTypeId({})).toBeUndefined();
    });

    it('identifies team accounts', () => {
      expect(isTeamAccount(userWith({ userType: TEAM_USER_TYPE }))).toBe(true);
      expect(isTeamAccount(userWith({ userType: INDIVIDUAL_USER_TYPE }))).toBe(false);
      expect(isTeamAccount(undefined)).toBe(false);
    });

    it('identifies individual accounts', () => {
      expect(isIndividualAccount(userWith({ userType: INDIVIDUAL_USER_TYPE }))).toBe(true);
      expect(isIndividualAccount(userWith({ userType: TEAM_USER_TYPE }))).toBe(false);
    });
  });

  describe('reading codes', () => {
    it('returns the team code', () => {
      expect(getTeamCode(userWith({ teamCode: 'NRK7MQ9P2' }))).toEqual('NRK7MQ9P2');
      expect(getTeamCode(userWith({}))).toBeUndefined();
    });

    it('returns joined team codes as an array', () => {
      expect(getJoinedTeamCodes(userWith({ teamCodes: ['NRAAAAAA2', 'NRBBBBBB3'] }))).toEqual([
        'NRAAAAAA2',
        'NRBBBBBB3',
      ]);
      expect(getJoinedTeamCodes(userWith({}))).toEqual([]);
      expect(getJoinedTeamCodes(userWith({ teamCodes: 'not-an-array' }))).toEqual([]);
      expect(getJoinedTeamCodes(undefined)).toEqual([]);
    });
  });

  describe('normalizeTeamCode', () => {
    it('uppercases and strips non-alphanumerics', () => {
      expect(normalizeTeamCode('nr-k7m q9p2')).toEqual('NRK7MQ9P2');
      expect(normalizeTeamCode('NRK7MQ9P2')).toEqual('NRK7MQ9P2');
    });

    it('handles nullish input', () => {
      expect(normalizeTeamCode(undefined)).toEqual('');
      expect(normalizeTeamCode(null)).toEqual('');
    });
  });

  describe('isValidTeamCodeFormat', () => {
    it('accepts well-formed codes regardless of formatting', () => {
      expect(isValidTeamCodeFormat('NRK7MQ9P2')).toBe(true);
      expect(isValidTeamCodeFormat('nr-k7mq9p2')).toBe(true);
    });

    it('rejects malformed codes', () => {
      expect(isValidTeamCodeFormat('NRK7MQ9')).toBe(false); // too short
      expect(isValidTeamCodeFormat('XXK7MQ9P2')).toBe(false); // wrong prefix
      expect(isValidTeamCodeFormat('NRK7MQ9PI')).toBe(false); // ambiguous char I not in alphabet
      expect(isValidTeamCodeFormat('')).toBe(false);
    });
  });

  describe('formatTeamCode', () => {
    it('inserts a dash after the prefix for valid codes', () => {
      expect(formatTeamCode('NRK7MQ9P2')).toEqual('NR-K7MQ9P2');
      expect(formatTeamCode('nrk7mq9p2')).toEqual('NR-K7MQ9P2');
    });

    it('returns the input unchanged when it is not a valid code', () => {
      expect(formatTeamCode('hello')).toEqual('hello');
    });
  });

  describe('generateTeamCode', () => {
    it('produces a valid, canonical code', () => {
      const code = generateTeamCode();
      expect(isValidTeamCodeFormat(code)).toBe(true);
      expect(code).toEqual(normalizeTeamCode(code));
    });

    it('is deterministic with an injected RNG and uses the unambiguous alphabet', () => {
      const code = generateTeamCode(() => 0); // first alphabet char is 'A'
      expect(code).toEqual('NRAAAAAAA');
    });

    it('produces distinct codes across many draws', () => {
      const codes = new Set(Array.from({ length: 500 }, () => generateTeamCode()));
      // With 31^7 entropy, 500 random codes should not collide.
      expect(codes.size).toEqual(500);
    });
  });

  describe('addTeamCode / removeTeamCode', () => {
    it('adds a normalized code without duplicates', () => {
      expect(addTeamCode([], 'nr-k7mq9p2')).toEqual(['NRK7MQ9P2']);
      expect(addTeamCode(['NRK7MQ9P2'], 'NRK7MQ9P2')).toEqual(['NRK7MQ9P2']);
      expect(addTeamCode(undefined, 'NRK7MQ9P2')).toEqual(['NRK7MQ9P2']);
    });

    it('removes a normalized code', () => {
      expect(removeTeamCode(['NRAAAAAA2', 'NRBBBBBB3'], 'nr-aaaaaa2')).toEqual(['NRBBBBBB3']);
      expect(removeTeamCode(['NRAAAAAA2'], 'NRZZZZZZ9')).toEqual(['NRAAAAAA2']);
      expect(removeTeamCode(undefined, 'NRAAAAAA2')).toEqual([]);
    });
  });
});
