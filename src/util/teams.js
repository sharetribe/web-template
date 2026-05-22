/**
 * Helpers for NextRep team accounts and team codes.
 *
 * Data model (option A — dynamic teams + codes):
 * - A Team account is a user whose `publicData.userType === TEAM_USER_TYPE`. Its unique,
 *   non-expiring join code lives at `publicData.teamCode`.
 * - An Individual joins teams by entering codes; the codes they belong to are stored at
 *   `publicData.teamCodes` (array). Membership is many-to-many and can be edited retroactively.
 * - When a member posts gear, the listing is stamped with the member's `publicData.teamCodes`
 *   so a team dashboard can find member listings via `pub_teamCodes`.
 *
 * Note: the Console `userType` options are `teamname` (Team account) and `individual`.
 */

// User type ids as configured in Sharetribe Console (verified via asset API).
export const TEAM_USER_TYPE = 'teamname';
export const INDIVIDUAL_USER_TYPE = 'individual';

// Team code shape: prefix "NR" + 7 chars from an unambiguous alphabet (no I, L, O, 0, 1).
const CODE_PREFIX = 'NR';
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_BODY_LENGTH = 7;
const TEAM_CODE_REGEXP = new RegExp(`^${CODE_PREFIX}[${CODE_ALPHABET}]{${CODE_BODY_LENGTH}}$`);

/**
 * Read the user type id from a user/currentUser API entity.
 * @param {Object} user API entity
 * @returns {String|undefined} the userType id, e.g. 'teamname' or 'individual'
 */
export const getUserTypeId = user => user?.attributes?.profile?.publicData?.userType;

/**
 * @param {Object} user API entity
 * @returns {Boolean} true if the user is a Team account
 */
export const isTeamAccount = user => getUserTypeId(user) === TEAM_USER_TYPE;

/**
 * @param {Object} user API entity
 * @returns {Boolean} true if the user is an Individual account
 */
export const isIndividualAccount = user => getUserTypeId(user) === INDIVIDUAL_USER_TYPE;

/**
 * The team's own join code (only meaningful for Team accounts).
 * @param {Object} user API entity
 * @returns {String|undefined} the canonical team code
 */
export const getTeamCode = user => user?.attributes?.profile?.publicData?.teamCode;

/**
 * The list of team codes an individual has joined.
 * @param {Object} user API entity
 * @returns {String[]} canonical team codes (empty array if none)
 */
export const getJoinedTeamCodes = user => {
  const codes = user?.attributes?.profile?.publicData?.teamCodes;
  return Array.isArray(codes) ? codes : [];
};

/**
 * Normalize user-entered code to its canonical form: uppercase, alphanumeric only.
 * Lets "nr-k7m q9p2", "NRK7MQ9P2" etc. all compare equal.
 * @param {String} input raw user input
 * @returns {String} canonical code
 */
export const normalizeTeamCode = input =>
  String(input == null ? '' : input)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

/**
 * @param {String} code raw or canonical code
 * @returns {Boolean} true if the code matches the NextRep team-code shape
 */
export const isValidTeamCodeFormat = code => TEAM_CODE_REGEXP.test(normalizeTeamCode(code));

/**
 * Format a canonical code for display, e.g. "NRK7MQ9P2" -> "NR-K7MQ9P2".
 * @param {String} code canonical code
 * @returns {String} display form (unchanged if it doesn't look like a team code)
 */
export const formatTeamCode = code => {
  const normalized = normalizeTeamCode(code);
  return TEAM_CODE_REGEXP.test(normalized)
    ? `${CODE_PREFIX}-${normalized.slice(CODE_PREFIX.length)}`
    : code;
};

/**
 * Generate a new canonical team code. Entropy (31^7 ≈ 2.7e10) makes random collisions
 * negligible; strict cross-marketplace uniqueness is enforced server-side via the
 * Integration API when those credentials are available.
 * @param {Function} [rng=Math.random] injectable RNG for testing
 * @returns {String} canonical code, e.g. 'NRK7MQ9P2'
 */
export const generateTeamCode = (rng = Math.random) => {
  let body = '';
  for (let i = 0; i < CODE_BODY_LENGTH; i += 1) {
    body += CODE_ALPHABET.charAt(Math.floor(rng() * CODE_ALPHABET.length));
  }
  return `${CODE_PREFIX}${body}`;
};

/**
 * Add a code to a member's joined list (idempotent, normalized).
 * @param {String[]} existingCodes current codes
 * @param {String} code code to add (raw or canonical)
 * @returns {String[]} new array including the normalized code, without duplicates
 */
export const addTeamCode = (existingCodes, code) => {
  const normalized = normalizeTeamCode(code);
  const current = Array.isArray(existingCodes) ? existingCodes : [];
  return current.includes(normalized) ? current : [...current, normalized];
};

/**
 * Remove a code from a member's joined list (normalized).
 * @param {String[]} existingCodes current codes
 * @param {String} code code to remove (raw or canonical)
 * @returns {String[]} new array without the code
 */
export const removeTeamCode = (existingCodes, code) => {
  const normalized = normalizeTeamCode(code);
  const current = Array.isArray(existingCodes) ? existingCodes : [];
  return current.filter(c => c !== normalized);
};
