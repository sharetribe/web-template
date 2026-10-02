import React, { useState, useMemo } from 'react';
import classNames from 'classnames';

import css from './KeywordAutocompleteInput.module.css';

// Terms suggested while the user types. Add or remove to match the product range.
export const DEFAULT_SUGGESTIONS = [
  'bag',
  'belt',
  'blouse',
  'boots',
  'cap',
  'coat',
  'dress',
  'hat',
  'hoodie',
  'jacket',
  'jeans',
  'jumpsuit',
  'pants',
  'sandals',
  'scarf',
  'shirt',
  'shoes',
  'shorts',
  'skirt',
  'sneakers',
  'socks',
  'sunglasses',
  'sweater',
  't-shirt',
  'top',
  'watch',
];

const MAX_SUGGESTIONS = 8;
const LIST_ID = 'keyword-suggestions';

const KeywordAutocompleteInput = props => {
  const {
    input,
    onSelect,
    suggestions = DEFAULT_SUGGESTIONS,
    className,
    inputClassName,
    inputRef,
    ...rest
  } = props;

  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const query = (input.value || '').trim().toLowerCase();

  const matches = useMemo(() => {
    if (!query) {
      return [];
    }
    return suggestions
      .filter(term => {
        const t = term.toLowerCase();
        return t.startsWith(query) && t !== query;
      })
      .slice(0, MAX_SUGGESTIONS);
  }, [query, suggestions]);

  const showList = isOpen && matches.length > 0;

  const choose = term => {
    input.onChange(term);
    setIsOpen(false);
    setActiveIndex(-1);
    if (onSelect) {
      onSelect(term);
    }
  };

  const handleKeyDown = e => {
    if (!showList) {
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => (i + 1) % matches.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => (i <= 0 ? matches.length - 1 : i - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      choose(matches[activeIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div className={classNames(css.root, className)}>
      <input
        {...rest}
        {...input}
        ref={inputRef}
        type="text"
        className={inputClassName}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={LIST_ID}
        aria-activedescendant={activeIndex >= 0 ? `${LIST_ID}-${activeIndex}` : undefined}
        onChange={e => {
          input.onChange(e);
          setIsOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={e => {
          if (input.onFocus) input.onFocus(e);
          setIsOpen(true);
        }}
        onBlur={e => {
          if (input.onBlur) input.onBlur(e);
          setIsOpen(false);
        }}
        onKeyDown={handleKeyDown}
      />

      {showList ? (
        <ul id={LIST_ID} role="listbox" className={css.list}>
          {matches.map((term, i) => (
            <li
              key={term}
              id={`${LIST_ID}-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              className={classNames(css.item, { [css.itemActive]: i === activeIndex })}
              onMouseDown={e => {
                e.preventDefault();
                choose(term);
              }}
              onMouseEnter={() => setActiveIndex(i)}
            >
              <span className={css.typed}>{term.slice(0, query.length)}</span>
              {term.slice(query.length)}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};

export default KeywordAutocompleteInput;
