import React, { useState, useRef, useEffect } from 'react';
import { useField } from 'react-final-form';
import { useIntl } from '../../util/reactIntl';
import css from './FieldGroupedMultiSelect.module.css';

/**
 * FieldGroupedMultiSelect — Final Form field that renders a grouped multiselect.
 *
 * Selected values appear as removable chips. The dropdown shows group headers with
 * individual toggleable option rows.
 *
 * @param {Object} props
 * @param {string} props.name - Final Form field name
 * @param {string} props.id - Base ID for the element
 * @param {string} props.label - Label rendered above the field
 * @param {Array} props.groups - Array of { key, label, options: [{option, label}] }
 * @param {Function} [props.validate] - Optional Final Form validation function
 * @param {string} [props.placeholder] - Placeholder text when nothing selected
 */
const FieldGroupedMultiSelect = props => {
  const { name, id, label, groups = [], validate, placeholder } = props;
  const intl = useIntl();

  const { input, meta } = useField(name, { validate });
  const value = Array.isArray(input.value) ? input.value : [];

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Build a flat map of option key → label for chip rendering
  const optionLabelMap = {};
  groups.forEach(group => {
    group.options.forEach(opt => {
      optionLabelMap[opt.option] = opt.label;
    });
  });

  const toggleOption = optionKey => {
    const next = value.includes(optionKey)
      ? value.filter(k => k !== optionKey)
      : [...value, optionKey];
    input.onChange(next);
  };

  const removeOption = (e, optionKey) => {
    e.stopPropagation();
    input.onChange(value.filter(k => k !== optionKey));
  };

  const clearAll = e => {
    e.stopPropagation();
    input.onChange([]);
  };

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = e => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const defaultPlaceholder =
    placeholder || intl.formatMessage({ id: 'FieldGroupedMultiSelect.placeholder' });

  const hasError = meta.touched && meta.error;

  return (
    <div className={css.root} ref={containerRef}>
      {label && (
        <label className={css.label} htmlFor={id}>
          {label}
        </label>
      )}
      <div
        id={id}
        className={`${css.control} ${isOpen ? css.controlOpen : ''} ${hasError ? css.controlError : ''}`}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className={css.selectedArea} onClick={() => setIsOpen(o => !o)}>
          {value.length === 0 ? (
            <span className={css.placeholder}>{defaultPlaceholder}</span>
          ) : (
            value.map(key => (
              <span key={key} className={css.chip}>
                {optionLabelMap[key] || key}
                <button
                  type="button"
                  className={css.chipRemove}
                  aria-label={intl.formatMessage(
                    { id: 'FieldGroupedMultiSelect.removeOption' },
                    { label: optionLabelMap[key] || key }
                  )}
                  onClick={e => removeOption(e, key)}
                >
                  ×
                </button>
              </span>
            ))
          )}
        </div>
        <div className={css.controls}>
          {value.length > 0 && (
            <button
              type="button"
              className={css.clearBtn}
              onClick={clearAll}
              title={intl.formatMessage({ id: 'FieldGroupedMultiSelect.clearAll' })}
            >
              ×
            </button>
          )}
          <button
            type="button"
            className={css.toggleBtn}
            onClick={() => setIsOpen(o => !o)}
            aria-label={intl.formatMessage({
              id: isOpen ? 'FieldGroupedMultiSelect.collapse' : 'FieldGroupedMultiSelect.expand',
            })}
          >
            {isOpen ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className={css.dropdown} role="listbox" aria-multiselectable="true">
          {groups.map(group => (
            <div key={group.key}>
              <div className={css.groupHeader}>{group.label}</div>
              {group.options.map(opt => {
                const isSelected = value.includes(opt.option);
                return (
                  <button
                    key={opt.option}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={`${css.option} ${isSelected ? css.optionSelected : ''}`}
                    onClick={() => toggleOption(opt.option)}
                  >
                    <span className={css.optionCheck}>{isSelected ? '✓' : ''}</span>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {hasError && <p className={css.error}>{meta.error}</p>}
    </div>
  );
};

export default FieldGroupedMultiSelect;
