import React from 'react';
import { string, bool } from 'prop-types';

import config from '../../../config';
import { intlShape, injectIntl } from '../../../util/reactIntl';
import { isMainSearchTypeKeywords } from '../../../util/search';

import SortByPlain from './SortByPlain';
import SortByPopup from './SortByPopup';

const SortBy = props => {
  const {
    sort,
    showAsPopup,
    selectedFilters,
    isConflictingFilterActive,
    hasConflictingFilters,
    intl,
    ...rest
  } = props;

  const { relevanceKey, relevanceFilter, queryParamName } = config.custom.sortConfig;

  // Ensure that keywords is included to activeFilter list when needed
  const activefilters = isMainSearchTypeKeywords(config)
    ? Object.keys({ keywords: '', ...selectedFilters })
    : Object.keys(selectedFilters);

  const isRelevanceFilterActive = activefilters.includes(relevanceFilter);

  const options = config.custom.sortConfig.options.map(option => {
    const isRelevance = option.key === relevanceKey;
    const isConflictingFilterSetAndActive = hasConflictingFilters && !isConflictingFilterActive;
    return {
      ...option,
      disabled:
        (isRelevance && (!isRelevanceFilterActive || isConflictingFilterSetAndActive)) ||
        (!isRelevance && isConflictingFilterActive),
    };
  });
  const defaultValue = 'createdAt';
  const isRelevanceSortActive = isRelevanceFilterActive && !sort;
  const relevanceValue = isRelevanceSortActive ? relevanceKey : null;
  const initialValue =
    hasConflictingFilters && !isConflictingFilterActive
      ? relevanceKey
      : sort || relevanceValue || defaultValue;
  const componentProps = {
    urlParam: queryParamName,
    label: intl.formatMessage({ id: 'SortBy.heading' }),
    options,
    initialValue,
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
