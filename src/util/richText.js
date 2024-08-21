import React from 'react';
import flow from 'lodash/flow';
import flatMap from 'lodash/flatMap';
import map from 'lodash/map';

import { sanitizeUrl } from './sanitize';

import { ExternalLink } from '../components';
// NOTE: This file imports components/index.js, which may lead to circular dependency

/**
 * Add zero width space (zwsp) around given breakchars (default '/') to make word break possible.
 * E.g. "one/two/three" => ["one", "​/​", "two" "​/​" "three"]
 *
 * @param {String} wordToBreak word to be broken from special character points.
 * @param {String} breakChars string containing possible chars that can be surrounded with zwsp.
 * @return {Array<String>} returns an array containing strings-
 */
export const zwspAroundSpecialCharsSplit = (wordToBreak, breakChars = '/') => {
  if (typeof wordToBreak !== 'string') {
    return wordToBreak;
  }

  const bcArray = breakChars.split('');

  // Escape special regular expression chars
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
  const escapedBCArray = bcArray.map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const reSplit = new RegExp('([' + escapedBCArray.join('') + '])');

  const zwsp = '​';
  return wordToBreak.split(reSplit).map(w => (bcArray.includes(w) ? `${zwsp}${w}${zwsp}` : w));
};

/**
 * Layouts are not fixed sizes - So, long words in text make flexboxed items to grow too big.
 * This wraps long words with span and adds given class to it
 *
 * @param {String} word to be wrapped if requirement (longWordMinLength) is met
 * @param {Number} key span needs a key in React/JSX
 * @param {Number} longWordMinLength minimum length when word is considered long
 * @param {String} longWordClass class to be added to spans
 * @return {node} returns a string or component
 */
export const wrapLongWord = (word, key, options = {}) => {
  const { longWordMinLength, longWordClass } = options;
  if (typeof word !== 'string' || !(longWordMinLength && longWordClass)) {
    return word;
  }

  const isShortWord = word.length <= longWordMinLength;
  return isShortWord ? (
    word
  ) : (
    <span key={key} className={longWordClass}>
      {word}
    </span>
  );
};

// Get the number of opened parenthesis
const getOpenedParenthesisCount = str =>
  Array.from(str).reduce((opened, currentChar) => {
    return currentChar === '(' ? ++opened : currentChar === ')' ? --opened : opened;
  }, 0);
// Split extra parentheses from a (partial) string containing URL
const splitExtraParentheses = str => {
  // If the count is not 0, the the parentheses are not balanced
  const parenthesesCount = getOpenedParenthesisCount(str);
  if (parenthesesCount < 0) {
    const trailingParentheses = Array.from(str)
      .reverse()
      .reduce((count, currentChar) => {
        return currentChar === ')' && parenthesesCount + count < 0 ? ++count : count;
      }, 0);

    // return an array of splitted strings, where 1st item is URL with balanced number of trailing parentheses
    // and the extra parentheses are returned as the second item in the array.
    return [str.slice(0, -1 * trailingParentheses), str.slice(-1 * trailingParentheses)];
  }
  return [str];
};

/**
 * Find links from words and surround them with <ExternalLink> component
 *
 * @param {String} word to be linkified if requirement (link) is met
 * @param {Number} key span needs a key in React/JSX
 * @param {Object} options than can contain keys: linkify, linkClass.
 * @return {Array<node>} returns a array containing ExternalLink component or strings
 */
export const linkifyOrWrapLinkSplit = (word, key, options = {}) => {
  if (typeof word !== 'string') {
    return word;
  }
  const { linkify, linkClass } = options;

  // TODO This can't handle links that contain parenthesis:
  // '(http://example.org/path_(etc))'
  // Currently extracts:
  // '(<a href=\"http://example.org/path_\" ...>http://example.org/path_</a>(etc))'
  //
  // We need to
  // 1) track whether token before link contains parenthesis as a last character
  //    before link token ("word.split(urlRegex)[linkIndex - 1]") and
  // 2) add enough characters to the end of link-token from the next token
  //    after link ("word.split(urlRegex)[linkIndex + 1]")

  // urlRegex modified from examples in
  // https://stackoverflow.com/questions/1500260/detect-urls-in-text-with-javascript

  // eslint-disable-next-line no-useless-escape
  const urlRegex = /(\bhttps?:\/\/[-A-Z0-9+&@#\/%?=~_|\(\)!:,.;]*[-A-Z0-9+&@#\/%=~_|\)])/gi;
  if (word.match(urlRegex)) {
    // Split strings like "(http://www.example.com)" to ["(","http://www.example.com",")"]
    return word.split(urlRegex).map(w => {
      const isEmptyString = !w.match(urlRegex);
      const [sanitizedURL, extra] =
        !isEmptyString && linkify ? splitExtraParentheses(sanitizeUrl(w)) : [w];
      return isEmptyString ? (
        w
      ) : linkify ? (
        <React.Fragment key={key}>
          <ExternalLink href={sanitizedURL} className={linkClass}>
            {sanitizedURL}
          </ExternalLink>
          {extra}
        </React.Fragment>
      ) : linkClass ? (
        <span key={key} className={linkClass}>
          {w}
        </span>
      ) : (
        w
      );
    });
  } else {
    return word;
  }
};

/**
 * Scan text to fill in wrappers for long words and add links.
 * Wrap long words: options should contain longWordMinLength & longWordClass
 * Linkify found links: options should contain "linkify: true" (linkClass is optional)
 *
 * Note: this autolinks only strings that start with 'http'. In addition, links are assumed
 *       to lead outside of the app. In-app linking is not supported atm.
 *
 * @param {String} text check text content
 * @param {Object} options { longWordMinLength, longWordClass, linkify = false, linkClass }
 * @return {Array<node>} returns a child array containing strings and inline elements
 */
export const richText = (text, options) => {
  if (typeof text !== 'string') {
    return text;
  }

  // longWordMinLength & longWordClass are needed for long words to be spanned
  // linkify = true is needed for links to be linkified (linkClass is optional)
  const { longWordMinLength, longWordClass, linkify = false, linkClass, breakChars } = options;
  const linkOrLongWordClass = linkClass ? linkClass : longWordClass;
  const nonWhiteSpaceSequence = /([^\s]+)/gi;
  const breakCharsConfig = breakChars != null ? breakChars : '/,';

  return text.split(nonWhiteSpaceSequence).reduce((acc, nextChild, i) => {
    const parts = flow([
      v =>
        flatMap(v, w => linkifyOrWrapLinkSplit(w, i, { linkify, linkClass: linkOrLongWordClass })),
      v => flatMap(v, w => zwspAroundSpecialCharsSplit(w, breakCharsConfig)),
      v => map(v, (w, j) => wrapLongWord(w, `${i}${j}`, { longWordMinLength, longWordClass })),
    ])([nextChild]);
    return acc.concat(parts);
  }, []);
};
