import React, { useState, useEffect, useRef } from 'react';
import { Field } from 'react-final-form';
import classNames from 'classnames';
import { ValidationError, HelpText } from '../../components';

import css from './FieldMultiSelect.module.css';

const ChevronIcon = () => (
  <svg width="14" height="8" viewBox="0 0 14 8" fill="none" aria-hidden="true">
    <path
      d="M1 1L7 7L13 1"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Inner render component for FieldMultiSelect.
 * Receives `input` and `meta` from Final Form's Field.
 */
const FieldMultiSelectComponent = props => {
  const {
    rootClassName,
    className,
    id,
    label,
    helpText,
    options = [],
    maxItems = 3,
    placeholder,
    input,
    meta,
    hideErrorMessage,
  } = props;

  if (label && !id) {
    throw new Error('id required when a label is given');
  }

  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  const selected = Array.isArray(input.value) ? input.value : [];
  const { touched, error } = meta;
  const hasError = !!(touched && error);
  const fieldMeta = { touched: hasError, error };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = event => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = key => {
    if (selected.includes(key)) {
      input.onChange(selected.filter(s => s !== key));
    } else if (selected.length < maxItems) {
      input.onChange([...selected, key]);
    }
    // Mark field as touched when interacting
    input.onBlur();
  };

  const removeChip = (e, key) => {
    e.stopPropagation();
    input.onChange(selected.filter(s => s !== key));
    input.onBlur();
  };

  const classes = classNames(rootClassName || css.root, className);

  return (
    <div className={classes} ref={wrapperRef}>
      {label ? <label htmlFor={id}>{label}</label> : null}

      <div
        id={id}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={`${id}-listbox`}
        className={classNames(css.control, {
          [css.controlOpen]: isOpen,
          [css.controlError]: hasError,
        })}
        onClick={() => setIsOpen(prev => !prev)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(prev => !prev);
          }
          if (e.key === 'Escape') setIsOpen(false);
        }}
        tabIndex={0}
      >
        <div className={css.inner}>
          {selected.length > 0 ? (
            selected.map(key => {
              const option = options.find(o => o.key === key);
              return option ? (
                <span key={key} className={css.chip}>
                  {option.label}
                  <button
                    type="button"
                    className={css.chipRemove}
                    onClick={e => removeChip(e, key)}
                    aria-label={`Remove ${option.label}`}
                  >
                    ×
                  </button>
                </span>
              ) : null;
            })
          ) : (
            <span className={css.placeholder}>{placeholder}</span>
          )}
        </div>
        <span className={classNames(css.chevron, { [css.chevronOpen]: isOpen })}>
          <ChevronIcon />
        </span>
      </div>

      {isOpen && options.length > 0 && (
        <ul id={`${id}-listbox`} className={css.dropdown} role="listbox" aria-multiselectable>
          {options.map(option => {
            const isSelected = selected.includes(option.key);
            const isDisabled = !isSelected && selected.length >= maxItems;
            return (
              <li
                key={option.key}
                role="option"
                aria-selected={isSelected}
                className={classNames(css.option, {
                  [css.optionSelected]: isSelected,
                  [css.optionDisabled]: isDisabled,
                })}
                onClick={() => !isDisabled && toggleOption(option.key)}
              >
                {option.label}
              </li>
            );
          })}
        </ul>
      )}

      <HelpText helpText={helpText} />
      {hideErrorMessage ? null : <ValidationError fieldMeta={fieldMeta} />}
    </div>
  );
};

/**
 * Reusable Final Form multi-select dropdown field.
 * Allows selecting multiple values from a list, displayed as chips.
 *
 * @component
 * @param {string} props.name - Final Form field name (required)
 * @param {string} props.id - HTML id for the control. Required when label is given.
 * @param {string} [props.label] - Label text above the field
 * @param {string} [props.placeholder] - Placeholder shown when no items are selected
 * @param {string} [props.helpText] - Help text shown below the field
 * @param {Array<{key: string, label: string}>} props.options - Selectable options
 * @param {number} [props.maxItems=3] - Maximum number of selectable items
 * @param {Function} [props.validate] - Final Form validate function
 * @param {string} [props.className] - Extra class added to root element
 * @param {string} [props.rootClassName] - Class overriding the root element class
 * @param {boolean} [props.hideErrorMessage] - When true, validation error is not shown
 * @returns {JSX.Element}
 */
const FieldMultiSelect = props => <Field component={FieldMultiSelectComponent} {...props} />;

export default FieldMultiSelect;
