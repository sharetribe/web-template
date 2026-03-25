import React from 'react';

import { useConfiguration } from '../../../context/configurationContext';
import { useIntl } from '../../../util/reactIntl';
import { isMainSearchTypeKeywords } from '../../../util/search';

import SortByPlain from './SortByPlain';
import SortByPopup from './SortByPopup';

import css from './SortBy.module.css';

/**
 * SortBy component
 *
 * @component
 * @param {Object} props
 * @param {string} [props.sort] - The sort
 * @param {boolean} [props.showAsPopup] - Whether to show as popup
 * @param {boolean} props.isConflictingFilterActive - Whether the conflicting filter is active
 * @param {boolean} [props.hasConflictingFilters] - Whether there are filters that could conflict
 * @param {'mobile' | 'desktop'} [props.mode] - The mode
 * @returns {JSX.Element}
 */
const SortBy = props => {
  const config = useConfiguration();
  const intl = useIntl();
  const {
    sort,
    showAsPopup = false,
    selectedFilters,
    isConflictingFilterActive,
    hasConflictingFilters,
    mode = 'desktop',
    ...rest
  } = props;

  // Don't render the component if there are no available options
  if (config?.search?.sortConfig?.options?.length === 0) {
    return null;
  }

  const sortConfig = config.search.sortConfig;
  const { relevanceKey, relevanceFilter, queryParamName } = sortConfig;

  const mobileClassesMaybe =
    mode === 'mobile'
      ? {
          rootClassName: css.sortBy,
          menuLabelRootClassName: css.sortByMenuLabel,
        }
      : {
          className: css.sortByDesktop,
          menuLabelRootClassName: css.sortByMenuLabel,
        };

  // Ensure that keywords is included to activeFilter list when needed
  const isMainSearchKeywords = isMainSearchTypeKeywords(config);
  const hasKeyworsFilter = config.search.defaultFilters.find(df => df.key === relevanceFilter);
  const isKeywordsFilterEnabled = isMainSearchKeywords || hasKeyworsFilter;

  const activeOptions = Object.keys(selectedFilters);

  const isRelevanceOptionActive = activeOptions.includes(relevanceFilter);

  const options = config.search.sortConfig.options.reduce((selected, option) => {
    const isRelevance = option.key === relevanceKey;
    const isConflictingFilterSetAndActive = hasConflictingFilters && !isConflictingFilterActive;

    // Some default options might be mapped with translation files
    const translationKeyLongMaybe = option?.labelTranslationKeyLong
      ? { longLabel: intl.formatMessage({ id: option?.labelTranslationKeyLong }) }
      : {};
    const translatedOption = option?.labelTranslationKey
      ? {
          key: option.key,
          label: intl.formatMessage(
            { id: option.labelTranslationKey },
            option.translationValues ?? {}
          ),
          ...translationKeyLongMaybe,
        }
      : option;
    // Omit relevance option if mainSearchType is not 'keywords'
    // Note: We might change this in the future, if multiple transaction types are allowed
    return isRelevance && !isKeywordsFilterEnabled
      ? selected
      : [
          ...selected,
          {
            ...translatedOption,
            disabled:
              (isRelevance && (!isRelevanceOptionActive || isConflictingFilterSetAndActive)) ||
              (!isRelevance && isConflictingFilterActive),
          },
        ];
  }, []);

  // we want the first item in the sort options list to be the default
  const defaultValue = options[0]?.key;
  const isRelevanceSortActive = isRelevanceOptionActive && !sort;
  const relevanceEnabled = sortConfig.options?.some(
    option => option.key === sortConfig.relevanceKey
  );
  const relevanceValue =
    relevanceEnabled && isRelevanceSortActive && selectedFilters[relevanceFilter]?.length > 0
      ? relevanceKey
      : null;
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

export default SortBy;
