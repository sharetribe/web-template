import React, { useState, useRef, useEffect } from 'react';
import { useField } from 'react-final-form';
import { useIntl } from '../../util/reactIntl';
import css from './FieldSearchableSelect.module.css';

/**
 * FieldSearchableSelect — Final Form field that renders a searchable single-select combobox.
 *
 * Renders a text input; typing filters the dropdown list. Selecting an option stores
 * the option key in the form and shows its label in the input. A clear button removes
 * the selection.
 *
 * @param {string} props.name - Final Form field name
 * @param {string} props.id - Base element ID
 * @param {string} props.label - Field label
 * @param {Array<{key: string, label: string}>} props.options - Selectable options
 * @param {Function} [props.validate]
 */
const FieldSearchableSelect = props => {
  const { name, id, label, options = [], validate } = props;
  const intl = useIntl();
  const { input, meta } = useField(name, { validate });

  const [searchText, setSearchText] = useState(
    () => options.find(opt => opt.key === input.value)?.label || ''
  );
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Sync display text when the form resets or external value changes
  useEffect(() => {
    const selectedLabel = options.find(opt => opt.key === input.value)?.label || '';
    setSearchText(input.value ? selectedLabel : '');
  }, [input.value, options]);

  // Close on outside click, reverting unsaved search text
  useEffect(() => {
    const handleOutsideClick = e => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        const selectedLabel = options.find(opt => opt.key === input.value)?.label || '';
        setSearchText(input.value ? selectedLabel : '');
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, input.value, options]);

  const filtered = options.filter(opt =>
    opt.label.toLowerCase().includes(searchText.toLowerCase())
  );

  const selectOption = opt => {
    input.onChange(opt.key);
    setSearchText(opt.label);
    setIsOpen(false);
  };

  const handleInputChange = e => {
    setSearchText(e.target.value);
    input.onChange('');
    setIsOpen(true);
  };

  const handleClear = () => {
    input.onChange('');
    setSearchText('');
    setIsOpen(false);
  };

  const hasError = meta.touched && meta.error;
  const placeholder = intl.formatMessage({ id: 'FieldSearchableSelect.placeholder' });
  const clearLabel = intl.formatMessage({ id: 'FieldSearchableSelect.clear' });
  const expandLabel = intl.formatMessage({ id: 'FieldSearchableSelect.expand' });
  const collapseLabel = intl.formatMessage({ id: 'FieldSearchableSelect.collapse' });

  return (
    <div className={css.root} ref={containerRef}>
      {label && (
        <label className={css.label} htmlFor={id}>
          {label}
        </label>
      )}
      <div
        className={`${css.control} ${isOpen ? css.controlOpen : ''} ${
          hasError ? css.controlError : ''
        }`}
      >
        <input
          id={id}
          type="text"
          role="combobox"
          className={css.input}
          value={searchText}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={`${id}-listbox`}
        />
        <div className={css.controls}>
          {input.value && (
            <button
              type="button"
              className={css.clearBtn}
              onClick={handleClear}
              aria-label={clearLabel}
              title={clearLabel}
            >
              ×
            </button>
          )}
          <button
            type="button"
            className={css.toggleBtn}
            onClick={() => setIsOpen(o => !o)}
            aria-label={isOpen ? collapseLabel : expandLabel}
          >
            {isOpen ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {isOpen && filtered.length > 0 && (
        <ul id={`${id}-listbox`} className={css.dropdown} role="listbox">
          {filtered.map(opt => (
            <li
              key={opt.key}
              role="option"
              aria-selected={opt.key === input.value}
              className={`${css.option} ${opt.key === input.value ? css.optionSelected : ''}`}
              onMouseDown={e => {
                // Prevent input blur before click registers
                e.preventDefault();
                selectOption(opt);
              }}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}

      {hasError && <p className={css.error}>{meta.error}</p>}
    </div>
  );
};

export default FieldSearchableSelect;
