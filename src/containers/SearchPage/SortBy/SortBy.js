import React from 'react';
import { string, bool } from 'prop-types';

import { useConfiguration } from '../../../context/configurationContext';
import { intlShape, injectIntl } from '../../../util/reactIntl';
import { isMainSearchTypeKeywords } from '../../../util/search';

import SortByPlain from './SortByPlain';
import SortByPopup from './SortByPopup';

import css from './SortBy.module.css';

const SortBy = props => {
  const config = useConfiguration();
  const {
    sort,
    showAsPopup,
    selectedFilters,
    isConflictingFilterActive,
    hasConflictingFilters,
    intl,
    mode,
    ...rest
  } = props;

  const { relevanceKey, relevanceFilter, queryParamName } = config.listing.sortConfig;

  const mobileClassesMaybe =
    mode === 'mobile'
      ? {
          rootClassName: css.sortBy,
          menuLabelRootClassName: css.sortByMenuLabel,
        }
      : { className: css.sortByDesktop };

  // Ensure that keywords is included to activeFilter list when needed
  const activeOptions = isMainSearchTypeKeywords(config)
    ? Object.keys({ keywords: '', ...selectedFilters })
    : Object.keys(selectedFilters);

  const isRelevanceOptionActive = activeOptions.includes(relevanceFilter);

  const options = config.listing.sortConfig.options.map(option => {
    const isRelevance = option.key === relevanceKey;
    const isConflictingFilterSetAndActive = hasConflictingFilters && !isConflictingFilterActive;
    return {
      ...option,
      disabled:
        (isRelevance && (!isRelevanceOptionActive || isConflictingFilterSetAndActive)) ||
        (!isRelevance && isConflictingFilterActive),
    };
  });
  const defaultValue = 'createdAt';
  const isRelevanceSortActive = isRelevanceOptionActive && !sort;
  const relevanceValue =
    isRelevanceSortActive && selectedFilters[relevanceFilter]?.length > 0 ? relevanceKey : null;
  const initialValue =
    hasConflictingFilters && !isConflictingFilterActive
      ? relevanceKey
      : sort || relevanceValue || defaultValue;
  const componentProps = {
    urlParam: queryParamName,
    label: intl.formatMessage({ id: 'SortBy.heading' }),
    options,
    initialValue,
    ...mobileClassesMaybe,
    ...rest,
  };
  return showAsPopup ? <SortByPopup {...componentProps} /> : <SortByPlain {...componentProps} />;
};

SortBy.defaultProps = {
  sort: null,
  showAsPopup: false,
};

SortBy.propTypes = {
  sort: string,
  showAsPopup: bool,
  isConflictingFilterActive: bool.isRequired,
  intl: intlShape.isRequired,
};

export default injectIntl(SortBy);
