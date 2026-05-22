'use strict';

import { getEffectiveBlockType } from './blocks';

describe('getEffectiveBlockType', () => {
  it('returns blockInstagramFeed for blockId "av-insta-feed"', () => {
    expect(getEffectiveBlockType('av-insta-feed', null, 'defaultBlock')).toBe('blockInstagramFeed');
  });

  it('returns blockMarkdownTable for blockId starting with "av-table-"', () => {
    expect(getEffectiveBlockType('av-table-pricing', null, 'defaultBlock')).toBe(
      'blockMarkdownTable'
    );
  });

  it('returns blockBrevoForm for blockId "av-contact-form"', () => {
    expect(getEffectiveBlockType('av-contact-form', null, 'defaultBlock')).toBe('blockBrevoForm');
  });

  it('returns blockWithCols for blockName containing "2 cols buttons ::"', () => {
    expect(getEffectiveBlockType('block-1', '2 cols buttons :: A :: B', 'defaultBlock')).toBe(
      'blockWithCols'
    );
  });

  it('returns fallbackType when no special blockId or blockName matches', () => {
    expect(getEffectiveBlockType('regular-block', 'Normal block', 'blockDefault')).toBe(
      'blockDefault'
    );
  });

  it('blockId shortcuts take priority over blockName shortcuts', () => {
    expect(getEffectiveBlockType('av-insta-feed', '2 cols buttons :: A', 'defaultBlock')).toBe(
      'blockInstagramFeed'
    );
  });

  it('handles null blockId and blockName gracefully', () => {
    expect(getEffectiveBlockType(null, null, 'blockDefault')).toBe('blockDefault');
  });

  it('handles undefined blockId and blockName gracefully', () => {
    expect(getEffectiveBlockType(undefined, undefined, 'blockDefault')).toBe('blockDefault');
  });
});
