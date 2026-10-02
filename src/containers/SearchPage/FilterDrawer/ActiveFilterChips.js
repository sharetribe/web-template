import React from 'react';

import { FormattedMessage, useIntl } from '../../../util/reactIntl';

import css from './FilterDrawer.module.css';

/**
 * Removable chips for the active filters, shown above the search results.
 *
 * @component
 * @param {Object} props
 * @param {Array<{ key: string, label: string, params: Object }>} props.chips see getActiveChips
 * @param {Function} props.onChangeParams called with the URL params that remove a chip
 * @param {Function} props.onClearAll
 * @returns {JSX.Element|null} chips
 */
const ActiveFilterChips = props => {
  const { chips, onChangeParams, onClearAll } = props;
  const intl = useIntl();

  if (chips.length === 0) {
    return null;
  }

  return (
    <>
      <ul className={css.activeChips}>
        {chips.map(chip => (
          <li key={chip.key}>
            <button
              type="button"
              className={css.activeChip}
              onClick={() => onChangeParams(chip.params)}
              aria-label={intl.formatMessage(
                { id: 'FilterDrawer.removeFilter' },
                { label: chip.label }
              )}
            >
              <span>{chip.label}</span>
              <svg
                className={css.activeChipIcon}
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  d="M6 6l12 12M18 6L6 18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className={css.clearAllLink} onClick={onClearAll}>
        <FormattedMessage id="FilterDrawer.resetAll" />
      </button>
    </>
  );
};

export default ActiveFilterChips;
