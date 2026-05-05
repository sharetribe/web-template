import React, { useState, useRef, useEffect } from 'react';
import { useField } from 'react-final-form';
import { useIntl } from '../../util/reactIntl';
import { swatchColors, swatchBg } from '../FieldSwatch/FieldSwatch';
import css from './FieldColorDropdown.module.css';

const CheckIcon = () => (
  <svg className={css.checkIcon} width="14" height="14" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M5.636621 10.7824771L3.3573694 8.6447948c-.4764924-.4739011-.4764924-1.2418639 0-1.7181952.4777142-.473901 1.251098-.473901 1.7288122 0l1.260291 1.1254782 2.8256927-4.5462307c.3934117-.5431636 1.1545778-.6695372 1.7055985-.278265.5473554.3912721.6731983 1.150729.2797866 1.6951077l-3.6650524 5.709111c-.2199195.306213-.5803433.5067097-.9920816.5067097-.3225487 0-.6328797-.1263736-.8637952-.3560334z"
      fill="#FFF"
    />
  </svg>
);

const getSwatchStyle = colorKey => {
  if (swatchColors[colorKey]) {
    return { backgroundColor: swatchColors[colorKey] };
  }
  if (swatchBg[colorKey]) {
    return {
      backgroundImage: `url(${swatchBg[colorKey]})`,
      backgroundSize: 'cover',
    };
  }
  return { backgroundColor: '#ccc' };
};

/**
 * FieldColorDropdown — Final Form field that renders a color grid picker.
 *
 * Closed state: selected colors shown as small circles, ▼ toggle button.
 * Open state: inline panel with 4-column grid; each cell = circle + label;
 * selected cells highlighted with orange border + checkmark overlay.
 *
 * @param {Object} props
 * @param {string} props.name - Final Form field name
 * @param {string} props.id - Base ID
 * @param {string} props.label - Field label
 * @param {Array} props.options - Array of { key, label } from enumOptions
 * @param {Function} [props.validate]
 */
const FieldColorDropdown = props => {
  const { name, id, label, options = [], validate } = props;
  const intl = useIntl();

  const { input, meta } = useField(name, { validate });
  const value = Array.isArray(input.value) ? input.value : [];

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const toggleColor = colorKey => {
    const next = value.includes(colorKey)
      ? value.filter(k => k !== colorKey)
      : [...value, colorKey];
    input.onChange(next);
  };

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

  const hasError = meta.touched && meta.error;
  const placeholder = intl.formatMessage({ id: 'FieldColorDropdown.placeholder' });
  const panelTitle = intl.formatMessage({ id: 'FieldColorDropdown.title' });
  const closeLabel = intl.formatMessage({ id: 'FieldColorDropdown.close' });

  // Build label map for displaying selected colors' labels
  const optionLabelMap = {};
  options.forEach(opt => {
    optionLabelMap[opt.key] = opt.label;
  });

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
        onClick={() => setIsOpen(o => !o)}
        role="button"
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(o => !o);
          }
        }}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className={css.selectedCircles}>
          {value.length === 0 ? (
            <span className={css.placeholder}>{placeholder}</span>
          ) : (
            value.map(key => (
              <span
                key={key}
                className={css.selectedCircle}
                style={getSwatchStyle(key)}
                title={optionLabelMap[key] || key}
              />
            ))
          )}
        </div>
        <span className={css.toggleIcon}>{isOpen ? '▲' : '▼'}</span>
      </div>

      {isOpen && (
        <div className={css.panel}>
          <div className={css.panelHeader}>
            <span className={css.panelTitle}>{panelTitle}</span>
            <button
              type="button"
              className={css.closeBtn}
              onClick={() => setIsOpen(false)}
              aria-label={closeLabel}
            >
              ×
            </button>
          </div>
          <div className={css.grid}>
            {options.map(opt => {
              const isSelected = value.includes(opt.key);
              return (
                <button
                  key={opt.key}
                  type="button"
                  className={`${css.colorCell} ${isSelected ? css.colorCellSelected : ''}`}
                  onClick={() => toggleColor(opt.key)}
                  aria-pressed={isSelected}
                  aria-label={opt.label}
                >
                  <span className={css.circleWrapper} style={getSwatchStyle(opt.key)}>
                    {isSelected && <CheckIcon />}
                  </span>
                  <span className={css.colorLabel}>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {hasError && <p className={css.error}>{meta.error}</p>}
    </div>
  );
};

export default FieldColorDropdown;
