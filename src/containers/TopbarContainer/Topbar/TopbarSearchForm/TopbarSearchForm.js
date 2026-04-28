import React, { useRef, useState } from 'react';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';
import { useHistory } from 'react-router-dom';

import { useRouteConfiguration } from '../../../../context/routeConfigurationContext';
import { useConfiguration } from '../../../../context/configurationContext';
import { useIntl } from '../../../../util/reactIntl';
import { createResourceLocatorString } from '../../../../util/routes';
import { isOriginInUse } from '../../../../util/search';
import { stringifyDateToISO8601, parseDateFromISO8601 } from '../../../../util/dates';

import { Form, OutsideClickHandler } from '../../../../components';

import FilterLocation from '../../../PageBuilder/Primitives/SearchCTA/FilterLocation/FilterLocation';
import FilterDateRange from '../../../PageBuilder/Primitives/SearchCTA/FilterDateRange/FilterDateRange';
import FilterBudget, { PRICE_MIN, PRICE_MAX } from '../../../PageBuilder/Primitives/SearchCTA/FilterBudget/FilterBudget';

import IconSearchDesktop from './IconSearchDesktop';
import css from './TopbarSearchForm.module.css';

// Format date range param ("2024-06-01,2024-06-30") into a short label
const formatDateLabel = (datesParam, intl) => {
  if (!datesParam) return null;
  const [startStr, endStr] = datesParam.split(',');
  if (!startStr || !endStr) return null;
  try {
    const start = parseDateFromISO8601(startStr);
    const end = parseDateFromISO8601(endStr);
    return intl.formatDateTimeRange(start, end, { month: 'short', day: 'numeric' });
  } catch (e) {
    return null;
  }
};

// Format price param ("0,2200") (monthly) into "$0 – $2,200/mo"
const formatBudgetLabel = priceParam => {
  if (!priceParam) return null;
  const [minStr, maxStr] = priceParam.split(',');
  const min = parseInt(minStr, 10);
  const max = parseInt(maxStr, 10);
  if (isNaN(min) || isNaN(max)) return null;
  const minLabel = `$${min.toLocaleString()}`;
  const maxLabel = max >= PRICE_MAX ? `$${PRICE_MAX.toLocaleString()}+` : `$${max.toLocaleString()}`;
  return `${minLabel} – ${maxLabel}/mo`;
};

// Parse dates param ("2024-06-01,2024-06-30") into { startDate, endDate } for FinalForm
const parseDateRangeInitialValue = datesParam => {
  if (!datesParam) return undefined;
  const [startStr, endStr] = datesParam.split(',');
  if (!startStr || !endStr) return undefined;
  try {
    return {
      startDate: parseDateFromISO8601(startStr),
      endDate: parseDateFromISO8601(endStr),
    };
  } catch (e) {
    return undefined;
  }
};

// Parse price param (monthly) into { minValue, maxValue } for the budget slider
const parsePriceInitialValue = priceParam => {
  if (!priceParam) return { minValue: PRICE_MIN, maxValue: PRICE_MAX };
  const [minStr, maxStr] = priceParam.split(',');
  const min = parseInt(minStr, 10);
  const max = parseInt(maxStr, 10);
  return {
    minValue: isNaN(min) ? PRICE_MIN : min,
    maxValue: isNaN(max) ? PRICE_MAX : max,
  };
};

const TopbarSearchForm = props => {
  const { className, rootClassName, initialValues = {} } = props;

  const [isExpanded, setIsExpanded] = useState(false);
  const [formKey, setFormKey] = useState(0);

  // Recomputed fresh each time the panel opens so URL changes from the filter
  // pills (price, dates, etc.) are reflected when the user reopens the form.
  const formInitialValues = useRef(null);
  if (!isExpanded) {
    // Precompute so the ref is ready the moment the form mounts.
    formInitialValues.current = {
      location: initialValues.location || null,
      dateRange: parseDateRangeInitialValue(initialValues.dates),
      price: parsePriceInitialValue(initialValues.price),
    };
  }
  const [locationSelected, setLocationSelected] = useState(
    !!initialValues?.location?.selectedPlace
  );
  const [submitDisabled, setSubmitDisabled] = useState(false);

  const history = useHistory();
  const routeConfiguration = useRouteConfiguration();
  const config = useConfiguration();
  const intl = useIntl();

  // Labels for the collapsed pill
  const locationLabel = initialValues?.location?.search || null;
  const dateLabel = formatDateLabel(initialValues?.dates, intl);
  const budgetLabel = formatBudgetLabel(initialValues?.price);


  const handleFormSubmit = values => {
    let queryParams = {};

    if (values.location?.selectedPlace) {
      const {
        search,
        selectedPlace: { origin, bounds },
      } = values.location;
      queryParams.bounds = bounds;
      queryParams.address = search;
      if (isOriginInUse(config) && origin) {
        queryParams.origin = `${origin.lat},${origin.lng}`;
      }
    }

    if (values.dateRange) {
      const { startDate, endDate } = values.dateRange;
      if (startDate && endDate) {
        queryParams.dates = `${stringifyDateToISO8601(startDate)},${stringifyDateToISO8601(endDate)}`;
      }
    }

    if (values.price) {
      const { minValue = PRICE_MIN, maxValue = PRICE_MAX } = values.price;
      const isDefault = minValue === PRICE_MIN && maxValue === PRICE_MAX;
      if (!isDefault) {
        // Store monthly values directly in URL
        queryParams.price = `${minValue},${maxValue}`;
      }
    }

    history.push(createResourceLocatorString('SearchPage', routeConfiguration, {}, queryParams));
    setIsExpanded(false);
  };

  const classes = classNames(rootClassName, className, css.searchWrapper);

  return (
    <div className={classes}>
      {/* ── Collapsed pill — always rendered to keep topbar layout stable ── */}
      <button
        className={classNames(css.collapsedPill, { [css.collapsedPillHidden]: isExpanded })}
        onClick={() => { setFormKey(k => k + 1); setIsExpanded(true); }}
        aria-label={intl.formatMessage({ id: 'TopbarSearchForm.expandSearch' })}
        aria-expanded={isExpanded}
      >
        <span
          className={classNames(css.pillSection, {
            [css.pillSectionFilled]: !!locationLabel,
          })}
        >
          {locationLabel || intl.formatMessage({ id: 'TopbarSearchForm.where' })}
        </span>
        <span className={css.pillDivider} />
        <span
          className={classNames(css.pillSection, {
            [css.pillSectionFilled]: !!dateLabel,
          })}
        >
          {dateLabel || intl.formatMessage({ id: 'TopbarSearchForm.when' })}
        </span>
        <span className={css.pillDivider} />
        <span
          className={classNames(css.pillSection, {
            [css.pillSectionFilled]: !!budgetLabel,
          })}
        >
          {budgetLabel || intl.formatMessage({ id: 'TopbarSearchForm.budget' })}
        </span>
        <span className={css.pillSearchButton}>
          <IconSearchDesktop className={css.pillSearchIcon} />
        </span>
      </button>

      {/* ── Expanded 3-field bar — fixed below the topbar, only when open ── */}
      {isExpanded ? (
        <OutsideClickHandler
          className={css.expandedWrapper}
          onOutsideClick={() => setIsExpanded(false)}
        >
          <FinalForm
            key={formKey}
            initialValues={formInitialValues.current}
            onSubmit={handleFormSubmit}
            render={({ handleSubmit }) => (
              <Form className={css.expandedForm} onSubmit={handleSubmit}>
                <div className={css.expandedFields}>
                  <div className={css.expandedField}>
                    <FilterLocation
                      setSubmitDisabled={setSubmitDisabled}
                      onLocationSelected={setLocationSelected}
                      alignLeft={true}
                    />
                  </div>
                  <div className={css.expandedFieldDivider} />
                  <div className={css.expandedField}>
                    <FilterDateRange config={config} alignLeft={false} initialDateLabel={dateLabel} />
                  </div>
                  <div className={css.expandedFieldDivider} />
                  <div className={css.expandedField}>
                    <FilterBudget alignLeft={false} />
                  </div>
                </div>
                <button
                  className={css.expandedSearchButton}
                  type="submit"
                  disabled={submitDisabled}
                  aria-label={intl.formatMessage({ id: 'TopbarSearchForm.search' })}
                >
                  <IconSearchDesktop className={css.expandedSearchIcon} />
                </button>
              </Form>
            )}
          />
        </OutsideClickHandler>
      ) : null}
    </div>
  );
};

export default TopbarSearchForm;
