import React, { useState, useEffect } from 'react';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

// Import configs and util modules
import { FormattedMessage } from '../../../../util/reactIntl';
import { getDefaultTimeZoneOnBrowser, timestampToDate } from '../../../../util/dates';
import { AVAILABILITY_MULTIPLE_SEATS, LISTING_STATE_DRAFT } from '../../../../util/types';
import { DAY, isFullDay } from '../../../../transactions/transaction';

// Import shared components
import { Button, H3, InlineTextButton, ListingLink, Modal, Form } from '../../../../components';

// Import modules from this directory
import EditListingAvailabilityPlanForm from './EditListingAvailabilityPlanForm';
import EditListingAvailabilityExceptionForm from './EditListingAvailabilityExceptionForm';
import MonthlyCalendar from './MonthlyCalendar/MonthlyCalendar';

import css from './EditListingAvailabilityPanel.module.css';

// This is the order of days as JavaScript understands them
// The number returned by "new Date().getDay()" refers to day of week starting from sunday.
const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

// This is the order of days as JavaScript understands them
// The number returned by "new Date().getDay()" refers to day of week starting from sunday.
const rotateDays = (days, startOfWeek) => {
  return startOfWeek === 0 ? days : days.slice(startOfWeek).concat(days.slice(0, startOfWeek));
};

const defaultTimeZone = () =>
  typeof window !== 'undefined' ? getDefaultTimeZoneOnBrowser() : 'Etc/UTC';

///////////////////////////////////////////////////
// EditListingAvailabilityExceptionPanel - utils //
///////////////////////////////////////////////////

// Create initial entry mapping for form's initial values
const createEntryDayGroups = (entries = {}) => {
  // Collect info about which days are active in the availability plan form:
  let activePlanDays = [];
  return entries.reduce((groupedEntries, entry) => {
    const { startTime, endTime: endHour, dayOfWeek, seats } = entry;
    const dayGroup = groupedEntries[dayOfWeek] || [];
    activePlanDays = activePlanDays.includes(dayOfWeek)
      ? activePlanDays
      : [...activePlanDays, dayOfWeek];
    return {
      ...groupedEntries,
      [dayOfWeek]: [
        ...dayGroup,
        {
          startTime,
          endTime: endHour === '00:00' ? '24:00' : endHour,
          seats,
        },
      ],
      activePlanDays,
    };
  }, {});
};

// Create initial values for the availability plan
const createInitialPlanValues = availabilityPlan => {
  const { timezone, entries } = availabilityPlan || {};
  const tz = timezone || defaultTimeZone();
  return {
    timezone: tz,
    ...createEntryDayGroups(entries),
  };
};

// Create entries from submit values
const createEntriesFromSubmitValues = values =>
  WEEKDAYS.reduce((allEntries, dayOfWeek) => {
    const dayValues = values[dayOfWeek] || [];
    const dayEntries = dayValues.map(dayValue => {
      const { startTime, endTime, seats } = dayValue;
      // Note: This template doesn't support seats yet.
      return startTime && endTime
        ? {
            dayOfWeek,
            seats: seats ?? 1,
            startTime,
            endTime: endTime === '24:00' ? '00:00' : endTime,
          }
        : null;
    });

    return allEntries.concat(dayEntries.filter(e => !!e));
  }, []);

// Create availabilityPlan from submit values
const createAvailabilityPlan = values => ({
  availabilityPlan: {
    type: 'availability-plan/time',
    timezone: values.timezone,
    entries: createEntriesFromSubmitValues(values),
  },
});

//////////////////////////////////
// EditListingAvailabilityPanel //
//////////////////////////////////

/**
 * @typedef {Object} AvailabilityException
 * @property {string} id
 * @property {'availabilityException'} type 'availabilityException'
 * @property {Object} attributes attributes
 * @property {Date} attributes.start The start of availability exception (inclusive)
 * @property {Date} attributes.end The end of availability exception (exclusive)
 * @property {Number} attributes.seats the number of seats available (0 means 'unavailable')
 */
/**
 * @typedef {Object} ExceptionQueryInfo
 * @property {Object|null} fetchExceptionsError
 * @property {boolean} fetchExceptionsInProgress
 */

/**
 * A panel where provider can set availabilityPlan (weekly default schedule)
 * and AvailabilityExceptions.
 * In addition, it combines the set values of both of those and shows a weekly schedule.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className
 * @param {string?} props.rootClassName
 * @param {Object} props.params pathparams
 * @param {Object?} props.locationSearch parsed search params
 * @param {Object?} props.listing listing entity from API (draft/published/etc.)
 * @param {Array<Object>} props.listingTypes listing type config from asset delivery API
 * @param {boolean} props.disabled
 * @param {boolean} props.ready
 * @param {Object.<string, ExceptionQueryInfo>?} props.monthlyExceptionQueries E.g. '2022-12': { fetchExceptionsError, fetchExceptionsInProgress }
 * @param {Object.<string, ExceptionQueryInfo>?} props.weeklyExceptionQueries E.g. '2022-12-14': { fetchExceptionsError, fetchExceptionsInProgress }
 * @param {Array<AvailabilityException>} props.allExceptions
 * @param {Function} props.onAddAvailabilityException
 * @param {Function} props.onDeleteAvailabilityException
 * @param {Function} props.onFetchExceptions
 * @param {Function} props.onSubmit
 * @param {Function} props.onManageDisableScrolling
 * @param {Function} props.onNextTab
 * @param {string} props.submitButtonText
 * @param {boolean} props.updateInProgress
 * @param {Object} props.errors
 * @param {Object} props.config app config
 * @param {Object} props.routeConfiguration
 * @param {Object} props.history history from React Router
 * @returns {JSX.Element} containing form that allows adding availability exceptions
 */
const EditListingAvailabilityPanel = props => {
  console.log('[DEBUG] EditListingAvailabilityPanel render (top)', { params: props.params, listing: props.listing });
  const {
    className,
    rootClassName,
    params,
    locationSearch,
    listing,
    listingTypes,
    monthlyExceptionQueries,
    weeklyExceptionQueries,
    allExceptions = [],
    onAddAvailabilityException,
    onDeleteAvailabilityException,
    disabled,
    ready,
    onFetchExceptions,
    onSubmit,
    onManageDisableScrolling,
    onNextTab,
    submitButtonText,
    updateInProgress,
    errors,
    config,
    routeConfiguration,
    history,
  } = props;
  // Hooks
  const [isEditExceptionsModalOpen, setIsEditExceptionsModalOpen] = useState(false);
  const [valuesFromLastSubmit, setValuesFromLastSubmit] = useState(null);
  const [nextTabError, setNextTabError] = useState(null);
  const [isNextTabInProgress, setIsNextTabInProgress] = useState(false);

  const firstDayOfWeek = config.localization.firstDayOfWeek;
  const classes = classNames(rootClassName || css.root, className);
  const listingAttributes = listing?.attributes;
  const { listingType, unitType } = listingAttributes?.publicData || {};
  const listingTypeConfig = listingTypes.find(conf => conf.listingType === listingType);

  const useFullDays = isFullDay(unitType);
  const useMultipleSeats = listingTypeConfig?.availabilityType === AVAILABILITY_MULTIPLE_SEATS;

  // Always show the calendar; use default plan if none exists
  const hasAvailabilityPlan = true;

  const isPublished = listing?.id && listingAttributes?.state !== LISTING_STATE_DRAFT;

  // Helper to generate a 24/7 plan for all days of the week
  const getAllDaysAlwaysAvailable = (timezone) => {
    // Use the same weekday keys as in generators.js
    const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    return {
      type: 'availability-plan/time',
      timezone: timezone || defaultTimeZone(),
      entries: WEEKDAYS.map(dayOfWeek => ({
        dayOfWeek,
        startTime: '00:00',
        endTime: '24:00',
        seats: 1,
      })),
    };
  };

  // Use the new 24/7 plan for all listings by default
  const defaultAvailabilityPlan = getAllDaysAlwaysAvailable(defaultTimeZone());
  const availabilityPlan = listingAttributes?.availabilityPlan || defaultAvailabilityPlan;

  // Debug: Log the availability plan and listing state
  console.log('🧪 [DEBUG] Availability Plan Debug:', {
    hasAvailabilityPlan,
    listingId: listing?.id,
    listingState: listingAttributes?.state,
    hasBackendPlan: !!listingAttributes?.availabilityPlan,
    availabilityPlan: availabilityPlan,
    defaultPlan: defaultAvailabilityPlan,
    allExceptions: allExceptions,
  });

  // CRITICAL FIX: Utility function to format dates as UTC midnight ISO strings
  const formatDateToUtcMidnight = (dateObj) => {
    if (!dateObj) return null;
    
    // If it's already a string in the correct format, return it
    if (typeof dateObj === 'string' && dateObj.includes('T00:00:00.000Z')) {
      return dateObj;
    }
    
    // If it's a string but not in the correct format, parse it
    if (typeof dateObj === 'string') {
      const date = new Date(dateObj);
      if (isNaN(date.getTime())) {
        console.error('Invalid date string:', dateObj);
        return null;
      }
      const dateStr = date.toISOString().split('T')[0]; // Get YYYY-MM-DD
      return `${dateStr}T00:00:00.000Z`;
    }
    
    // If it's a Date object
    if (dateObj instanceof Date) {
      const dateStr = dateObj.toISOString().split('T')[0]; // Get YYYY-MM-DD
      return `${dateStr}T00:00:00.000Z`;
    }
    
    console.error('Invalid date object:', dateObj);
    return null;
  };

  // Wrap the onAddAvailabilityException to always include listingId as a string and ISO8601 start/end
  const handleAddAvailabilityException = ({ start, end, seats }) => {
    console.log('🧪 [DEBUG] handleAddAvailabilityException called with:', { start, end, seats });
    console.log('🧪 [DEBUG] Listing object:', listing);
    console.log('🧪 [DEBUG] Listing ID:', listing?.id);
    console.log('🧪 [DEBUG] Listing ID type:', typeof listing?.id);
    
    if (onAddAvailabilityException && listing?.id) {
      // Ensure listingId is a string UUID (not a Sharetribe UUID object)
      const listingId = typeof listing.id === 'string' ? listing.id : listing.id.uuid;
      // Ensure start/end are properly formatted UTC midnight ISO strings
      const startISO = formatDateToUtcMidnight(start);
      const endISO = formatDateToUtcMidnight(end);

      console.log('🧪 [DEBUG] Processed values:', { listingId, startISO, endISO, seats });
      console.log('🧪 [DEBUG] Original start/end types:', { 
        startType: typeof start, 
        endType: typeof end,
        startIsDate: start instanceof Date,
        endIsDate: end instanceof Date
      });

      // Validate that we have valid dates
      if (!startISO || !endISO) {
        console.error('🧪 [DEBUG] Invalid dates:', { start, end, startISO, endISO });
        throw new Error('Invalid date format for availability exception');
      }

      // FIXED: Use simple structure as expected by Sharetribe Flex API (per bug fix document)
      const payload = {
        listingId: listingId,
        start: startISO,
        end: endISO,
        seats: seats || 0,
      };

      // Debug logs - show the exact structure being sent
      console.log('🧪 Final availabilityException payload:', JSON.stringify(payload, null, 2));
      console.log('Type of listing ID:', typeof listingId, listingId);
      console.log('Payload keys at root level:', Object.keys(payload));

      // Wrap the call in a try/catch to log backend errors
      try {
        console.log('🧪 [DEBUG] Calling onAddAvailabilityException with payload');
        return onAddAvailabilityException(payload)
          .then(response => {
            console.log('🧪 [DEBUG] onAddAvailabilityException succeeded:', response);
            return response;
          })
          .catch(error => {
            console.error('🧪 [DEBUG] onAddAvailabilityException failed with detailed error:', {
              message: error?.message,
              status: error?.response?.status,
              statusText: error?.response?.statusText,
              data: error?.response?.data,
              errors: error?.response?.data?.errors,
              config: error?.config
            });
            throw error;
          });
      } catch (err) {
        console.error('[Sherbrt DEBUG] Backend error:', err && err.data && err.data.errors ? err.data.errors : err);
        throw err;
      }
    } else {
      console.log('🧪 [DEBUG] handleAddAvailabilityException conditions not met:', {
        hasOnAddAvailabilityException: !!onAddAvailabilityException,
        hasListingId: !!listing?.id,
        listingId: listing?.id,
        listingIdType: typeof listing?.id,
      });
    }
  };

  // Log the presence and type of onNextTab at render
  console.log('[DEBUG] onNextTab prop:', onNextTab, typeof onNextTab);
  console.log('[DEBUG] onNextTab function details:', {
    isFunction: typeof onNextTab === 'function',
    name: onNextTab?.name,
    toString: onNextTab?.toString?.()?.substring(0, 100)
  });

  // Enhanced onNextTab handler with error feedback
  const handleNextTab = async (formValues) => {
    console.log("🟠 [DEBUG] handleNextTab called with:", formValues);
    // Prevent multiple simultaneous calls
    if (isNextTabInProgress) {
      console.log('🟠 [DEBUG] handleNextTab already in progress, ignoring call');
      return;
    }
    setNextTabError(null);
    setIsNextTabInProgress(true);
    try {
      // Create the availability data payload - allow empty plan and exceptions
      const availabilityData = {
        availabilityPlan: listing?.attributes?.availabilityPlan || {
          type: 'availability-plan/time',
          timezone: 'Etc/UTC',
          entries: [
            { dayOfWeek: 'mon', startTime: '00:00', endTime: '24:00', seats: 1 },
            { dayOfWeek: 'tue', startTime: '00:00', endTime: '24:00', seats: 1 },
            { dayOfWeek: 'wed', startTime: '00:00', endTime: '24:00', seats: 1 },
            { dayOfWeek: 'thu', startTime: '00:00', endTime: '24:00', seats: 1 },
            { dayOfWeek: 'fri', startTime: '00:00', endTime: '24:00', seats: 1 },
            { dayOfWeek: 'sat', startTime: '00:00', endTime: '24:00', seats: 1 },
            { dayOfWeek: 'sun', startTime: '00:00', endTime: '24:00', seats: 1 },
          ]
        },
        exceptions: allExceptions || []
      };
      console.log("🟠 [DEBUG] About to call onNextTab with:", availabilityData);
      const result = await onNextTab(availabilityData);
      console.log("🟠 [DEBUG] onNextTab returned");
    } catch (error) {
      console.error('🟠 [DEBUG] onNextTab failed:', error);
      setNextTabError(error?.message || 'Failed to advance to next step. Please try again.');
      setIsNextTabInProgress(false);
    }
  };

  // Debug log on initial render and every render (after variable declarations)
  console.log('[Sherbrt DEBUG] AvailabilityPanel render', {
    hasAvailabilityPlan,
    isEditExceptionsModalOpen,
    listingId: listing?.id,
    hasBackendPlan: !!listingAttributes?.availabilityPlan,
    onNextTab: typeof onNextTab,
    submitButtonText,
    isPublished,
    isNextTabInProgress,
    nextTabError
  });
  const initialPlanValues = valuesFromLastSubmit
    ? valuesFromLastSubmit
    : createInitialPlanValues(availabilityPlan);

  const handlePlanSubmit = values => {
    setValuesFromLastSubmit(values);

    // Final Form can wait for Promises to return.
    return onSubmit(createAvailabilityPlan(values))
      .then(() => {
        // setIsEditPlanModalOpen(false); // REMOVED
      })
      .catch(e => {
        // Don't close modal if there was an error
      });
  };

  const sortedAvailabilityExceptions = allExceptions;

  // Save exception click handler
  const saveException = values => {
    const { availability, exceptionStartTime, exceptionEndTime, exceptionRange, seats } = values;

    const seatCount = seats != null ? seats : availability === 'available' ? 1 : 0;

    // Exception date/time range is given through FieldDateRangeInput or
    // separate time fields.
    const range = useFullDays
      ? {
          start: exceptionRange?.startDate,
          end: exceptionRange?.endDate,
        }
      : {
          start: timestampToDate(exceptionStartTime),
          end: timestampToDate(exceptionEndTime),
        };

    // Ensure listingId is a string UUID (not a Sharetribe UUID object)
    const listingId = typeof listing.id === 'string' ? listing.id : listing.id.uuid;
    
    // CRITICAL FIX: Format dates as UTC midnight ISO strings as expected by the server
    const startISO = formatDateToUtcMidnight(range.start);
    const endISO = formatDateToUtcMidnight(range.end);
    
    // Validate that we have valid dates
    if (!startISO || !endISO) {
      console.error('🧪 [DEBUG] Invalid dates in saveException:', { start: range.start, end: range.end, startISO, endISO });
      throw new Error('Invalid date format for availability exception');
    }

    // FIXED: Use simple structure as expected by Sharetribe Flex API (per bug fix document)
    const payload = {
      listingId: listingId,
      start: startISO,
      end: endISO,
      seats: seatCount,
    };

    console.log('🧪 Final availabilityException payload:', JSON.stringify(payload, null, 2));
    console.log('🧪 [DEBUG] Original dates:', { start: range.start, end: range.end });
    console.log('🧪 [DEBUG] Formatted dates:', { start: startISO, end: endISO });

    return onAddAvailabilityException(payload)
      .then(() => {
        setIsEditExceptionsModalOpen(false);
      })
      .catch(e => {
        // Don't close modal if there was an error
      });
  };

  // Log when the button mounts
  useEffect(() => {
    console.log('[DEBUG] Button mounted');
  }, []);

  // Add global error handler for unhandled promise rejections
  useEffect(() => {
    const handleUnhandledRejection = (event) => {
      console.error('[DEBUG] Unhandled promise rejection:', event.reason);
      setNextTabError(event.reason?.message || 'Unhandled error occurred');
      setIsNextTabInProgress(false);
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // DOM Test to ensure form and submit button are properly wired
  useEffect(() => {
    setTimeout(() => {
      const form = document.querySelector("form");
      const button = document.querySelector('button[type="submit"]');

      if (!form) {
        console.error("[DEBUG] ❌ No <form> found in DOM.");
      } else if (!button) {
        console.error("[DEBUG] ❌ No <button type='submit'> found in DOM.");
      } else if (!form.contains(button)) {
        console.error("[DEBUG] ❌ Submit button is NOT inside the form.");
      } else {
        console.log("[DEBUG] ✅ Form and submit button are wired correctly.");
        console.log("[DEBUG] Form element:", form);
        console.log("[DEBUG] Submit button:", button);
      }
    }, 1000);
  }, []);

  return (
    <FinalForm
      onSubmit={(values) => {
        console.log("[DEBUG] handleSubmit called");
        return handleNextTab(values);
      }}
      render={({ handleSubmit, submitting, values }) => {
        console.log("[DEBUG] FinalForm render triggered", { submitting, values });
        
        return (
          <main className={classes}>
            <H3 as="h1" className={css.heading}>
              {isPublished ? (
                <FormattedMessage
                  id="EditListingAvailabilityPanel.title"
                  values={{ listingTitle: <ListingLink listing={listing} />, lineBreak: <br /> }}
                />
              ) : (
                <FormattedMessage
                  id="EditListingAvailabilityPanel.createListingTitle"
                  values={{ lineBreak: <br /> }}
                />
              )}
            </H3>

            <div className={css.planInfo} />

            {hasAvailabilityPlan ? (
              <>
                <MonthlyCalendar
                  className={css.section}
                  headerClassName={css.sectionHeader}
                  listingId={listing.id || null}
                  availabilityPlan={availabilityPlan}
                  availabilityExceptions={sortedAvailabilityExceptions}
                  weeklyExceptionQueries={weeklyExceptionQueries}
                  isDaily={unitType === DAY}
                  useFullDays={useFullDays}
                  useMultipleSeats={useMultipleSeats}
                  onAddAvailabilityException={handleAddAvailabilityException}
                  onDeleteAvailabilityException={onDeleteAvailabilityException}
                  onFetchExceptions={onFetchExceptions}
                  params={params}
                  locationSearch={locationSearch}
                  firstDayOfWeek={firstDayOfWeek}
                  routeConfiguration={routeConfiguration}
                  history={history}
                  timeZone={availabilityPlan.timezone}
                />
              </>
            ) : null}

            {errors.showListingsError ? (
              <p className={css.error}>
                <FormattedMessage id="EditListingAvailabilityPanel.showListingFailed" />
              </p>
            ) : null}

            {nextTabError ? (
              <p className={css.error}>
                <strong>Error advancing to next step:</strong> {nextTabError}
              </p>
            ) : null}

            {(() => {
              console.log('[DEBUG] Form render condition check:', { isPublished, submitButtonText });
              
              if (isPublished) {
                console.log('[DEBUG] ❌ Form NOT rendered because isPublished is true');
                return null;
              }
              
              console.log('[DEBUG] ✅ Form IS being rendered');
              return (
                <form onSubmit={handleSubmit}>
                  {(() => {
                    // Allow proceeding even without availability plan - make panel optional
                    const buttonDisabled = isNextTabInProgress || submitting;
                    console.log("RENDERING NEXT BUTTON");
                    console.log('[DEBUG] JSX: Rendering Next button', { 
                      hasAvailabilityPlan, 
                      isNextTabInProgress,
                      submitting,
                      onNextTab: typeof onNextTab,
                      submitButtonText,
                      isPublished,
                      buttonDisabled,
                      buttonText: isNextTabInProgress ? 'Processing...' : submitButtonText
                    });
                    
                    return (
                      <Button
                        className={css.goToNextTabButton}
                        type="submit"
                        disabled={buttonDisabled}
                      >
                        {isNextTabInProgress ? 'Processing...' : submitButtonText}
                      </Button>
                    );
                  })()}
                </form>
              );
            })()}

            {onManageDisableScrolling && isEditExceptionsModalOpen ? (
              <Modal
                id="EditAvailabilityExceptions"
                isOpen={isEditExceptionsModalOpen}
                onClose={() => setIsEditExceptionsModalOpen(false)}
                onManageDisableScrolling={onManageDisableScrolling}
                containerClassName={css.modalContainer}
                usePortal
              >
                <EditListingAvailabilityExceptionForm
                  formId="EditListingAvailabilityExceptionForm"
                  listingId={listing.id || null}
                  allExceptions={allExceptions}
                  monthlyExceptionQueries={monthlyExceptionQueries}
                  fetchErrors={errors}
                  onFetchExceptions={onFetchExceptions}
                  onSubmit={saveException}
                  timeZone={availabilityPlan.timezone}
                  unitType={unitType}
                  updateInProgress={updateInProgress}
                  useFullDays={useFullDays}
                  listingTypeConfig={listingTypeConfig}
                />
              </Modal>
            ) : null}
          </main>
        );
      }}
    />
  );
};

export default EditListingAvailabilityPanel;