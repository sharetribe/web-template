// Add format and parse functions. This file follows E.164 format for international numbers
// if the input starts with '+'.
// Note: this does not format phone numbers that don't start with '+'
//
// If you want to have a localized phone number formatting, you could create own format and parse functions.
// Check this Final Form example: https://codesandbox.io/s/10rzowm323

/**
 * Check if string starts with '+' character.
 * @param {String} str
 * @returns true if string starts with '+' character.
 */
const hasLeadingPlus = str => str.match(/^\+/g);

/**
 * Pick only digits from a string
 * @param {String} str
 * @returns string that contains only numbers
 */
const pickOnlyDigits = str => str.replace(/[^\d]/g, '');

/**
 * This picks only correct characters for e.164 formatted phone numbers if the phoneNumber starts with a '+' character.
 * Otherwise, the phone number is left as it is.
 *
 * @param {String} phoneNumber
 * @returns formatted E.164 phone number or a string that has not been formatted at all.
 */
const pickValidCharsForE164 = phoneNumber => {
  const number = phoneNumber || '';
  const startsWithPlus = !!hasLeadingPlus(number);
  const digitsOnly = pickOnlyDigits(number);
  // Digits must start with 1-9 and there can't be more than 15 digits altogether in E.164
  const noLeadingZeroDigits =
    digitsOnly.length > 0 && digitsOnly.charAt(0) === '0' ? digitsOnly.slice(1) : digitsOnly;

  return startsWithPlus && noLeadingZeroDigits.length > 15
    ? `+${noLeadingZeroDigits.slice(0, 15)}`
    : startsWithPlus
    ? `+${noLeadingZeroDigits}`
    : number;
};

/**
 * Format a phone number according to E.164 format.
 * This formats the value that form has. This is executed first if there are initial values given to the form.
 *
 * Matches with the following format:
 * +123 55 1234567, which is formatted as +123551234567
 */
export const format = value => {
  if (!value) {
    return '';
  }

  return pickValidCharsForE164(value);
};

/**
 * Parser that handles the input string so that the plain number can be saved.
 * This is executed, when user manually types or copy-pastes a phone number to the input field.
 */
export const parse = value => {
  return pickValidCharsForE164(value);
};
