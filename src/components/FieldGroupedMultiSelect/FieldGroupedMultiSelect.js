import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useField } from 'react-final-form';
import classNames from 'classnames';
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
  const { name, id, label, groups = [], validate, placeholder, className } = props;
  const intl = useIntl();
  const optionGroups = Array.isArray(groups) ? groups : [];

  const { input, meta } = useField(name, { validate });
  const value = Array.isArray(input.value) ? input.value : [];

  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef(null);

  const listboxId = `${id}-listbox`;
  const labelId = label ? `${id}-label` : undefined;

  const flatOptions = useMemo(
    () =>
      optionGroups.reduce((options, group) => {
        const groupOptions = Array.isArray(group.options) ? group.options : [];
        return options.concat(groupOptions);
      }, []),
    [optionGroups]
  );

  // Build a flat map of option key -> label for chip rendering.
  const optionLabelMap = useMemo(
    () =>
      flatOptions.reduce((labels, opt) => {
        labels[opt.option] = opt.label;
        return labels;
      }, {}),
    [flatOptions]
  );

  const toggleOption = optionKey => {
    const next = value.includes(optionKey)
      ? value.filter(k => k !== optionKey)
      : [...value, optionKey];
    input.onChange(next);
  };

  const openDropdown = nextActiveIndex => {
    if (flatOptions.length === 0) {
      return;
    }
    setIsOpen(true);
    setActiveIndex(nextActiveIndex);
  };

  const closeDropdown = () => {
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const toggleDropdown = () => {
    if (isOpen) {
      closeDropdown();
    } else {
      openDropdown(0);
    }
  };

  const handleTriggerKeyDown = e => {
    const lastIndex = flatOptions.length - 1;
    const hasOptions = flatOptions.length > 0;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!hasOptions) {
        return;
      }
      const nextIndex = isOpen ? (activeIndex + 1 > lastIndex ? 0 : activeIndex + 1) : 0;
      openDropdown(nextIndex);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!hasOptions) {
        return;
      }
      const nextIndex = isOpen ? (activeIndex - 1 < 0 ? lastIndex : activeIndex - 1) : lastIndex;
      openDropdown(nextIndex);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!isOpen) {
        openDropdown(0);
      } else if (activeIndex >= 0 && flatOptions[activeIndex]) {
        toggleOption(flatOptions[activeIndex].option);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeDropdown();
    } else if (e.key === 'Tab') {
      closeDropdown();
    }
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
  const triggerLabel = label ? undefined : defaultPlaceholder;

  const hasError = meta.touched && meta.error;
  const activeOption = isOpen && activeIndex >= 0 ? flatOptions[activeIndex] : null;
  const activeDescendant = activeOption ? `${id}-option-${activeOption.option}` : undefined;

  return (
    <div className={classNames(css.root, className)} ref={containerRef}>
      {label && (
        <label id={labelId} className={css.label} htmlFor={id}>
          {label}
        </label>
      )}
      <div
        className={`${css.control} ${isOpen ? css.controlOpen : ''} ${
          hasError ? css.controlError : ''
        }`}
      >
        <div className={css.selectedArea}>
          {value.length === 0 ? (
            <button
              id={id}
              type="button"
              className={css.trigger}
              role="combobox"
              aria-label={triggerLabel}
              aria-labelledby={labelId}
              aria-expanded={isOpen}
              aria-haspopup="listbox"
              aria-controls={listboxId}
              aria-activedescendant={activeDescendant}
              onClick={toggleDropdown}
              onKeyDown={handleTriggerKeyDown}
            >
              <span className={css.placeholder}>{defaultPlaceholder}</span>
            </button>
          ) : (
            <>
              {value.map(key => (
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
              ))}
              <button
                id={id}
                type="button"
                className={css.trigger}
                role="combobox"
                aria-label={triggerLabel}
                aria-labelledby={labelId}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-controls={listboxId}
                aria-activedescendant={activeDescendant}
                onClick={toggleDropdown}
                onKeyDown={handleTriggerKeyDown}
              />
            </>
          )}
        </div>
        <div className={css.controls}>
          {value.length > 0 && (
            <button
              type="button"
              className={css.clearBtn}
              onClick={clearAll}
              aria-label={intl.formatMessage({ id: 'FieldGroupedMultiSelect.clearAll' })}
              title={intl.formatMessage({ id: 'FieldGroupedMultiSelect.clearAll' })}
            >
              ×
            </button>
          )}
          <button
            type="button"
            className={css.toggleBtn}
            onClick={toggleDropdown}
            aria-label={intl.formatMessage({
              id: isOpen ? 'FieldGroupedMultiSelect.collapse' : 'FieldGroupedMultiSelect.expand',
            })}
          >
            {isOpen ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {isOpen && (
        <div id={listboxId} className={css.dropdown} role="listbox" aria-multiselectable="true">
          {optionGroups.map(group => (
            <div key={group.key}>
              <div className={css.groupHeader}>{group.label}</div>
              {(group.options || []).map(opt => {
                const isSelected = value.includes(opt.option);
                const isActive = activeOption?.option === opt.option;
                return (
                  <button
                    key={opt.option}
                    id={`${id}-option-${opt.option}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={`${css.option} ${isSelected ? css.optionSelected : ''} ${
                      isActive ? css.optionActive : ''
                    }`}
                    onClick={() => toggleOption(opt.option)}
                  >
                    <span className={css.optionCheck} aria-hidden="true">
                      {isSelected ? '✓' : ''}
                    </span>
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
