import React, { useState, useEffect } from 'react';
import { Field, Form as FinalForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import classNames from 'classnames';

// Import util modules
import { FormattedMessage, useIntl } from '../../../../util/reactIntl';
import { displayDescription } from '../../../../util/configHelpers.js';
import { useConfiguration } from '../../../../context/configurationContext.js';
import { EXTENDED_DATA_SCHEMA_TYPES, propTypes } from '../../../../util/types';
import {
  isFieldForCategory,
  isFieldForListingType,
  isValidCurrencyForTransactionProcess,
} from '../../../../util/fieldHelpers';
import { maxLength, required, composeValidators } from '../../../../util/validators';

// Import shared components
import {
  Form,
  Button,
  FieldSelect,
  FieldTextInput,
  FieldNumber,
  Heading,
  CustomExtendedDataField,
} from '../../../../components';
// Import modules from this directory
import css from './EditListingDetailsForm.module.css';

const TITLE_MAX_LENGTH = 60;

// Show various error messages
const ErrorMessage = props => {
  const { fetchErrors } = props;
  const { updateListingError, createListingDraftError, showListingsError } = fetchErrors || {};
  const errorMessage = updateListingError ? (
    <FormattedMessage id="EditListingDetailsForm.updateFailed" />
  ) : createListingDraftError ? (
    <FormattedMessage id="EditListingDetailsForm.createListingDraftError" />
  ) : showListingsError ? (
    <FormattedMessage id="EditListingDetailsForm.showListingFailed" />
  ) : null;

  if (errorMessage) {
    return <p className={css.error}>{errorMessage}</p>;
  }
  return null;
};

// Hidden input field
const FieldHidden = props => {
  const { name } = props;
  return (
    <Field id={name} name={name} type="hidden" className={css.unitTypeHidden}>
      {fieldRenderProps => <input {...fieldRenderProps?.input} />}
    </Field>
  );
};

// Field component that either allows selecting listing type (if multiple types are available)
// or just renders hidden fields:
// - listingType              Set of predefined configurations for each listing type
// - transactionProcessAlias  Initiate correct transaction against Marketplace API
// - unitType                 Main use case: pricing unit
const FieldSelectListingType = props => {
  const {
    name,
    listingTypes,
    hasPredefinedListingType,
    onListingTypeChange,
    formApi,
    formId,
    intl,
  } = props;
  const hasMultipleListingTypes = listingTypes?.length > 1;

  const handleOnChange = value => {
    const selectedListingType = listingTypes.find(config => config.listingType === value);
    formApi.change('transactionProcessAlias', selectedListingType.transactionProcessAlias);
    formApi.change('unitType', selectedListingType.unitType);

    if (onListingTypeChange) {
      onListingTypeChange(selectedListingType);
    }
  };
  const getListingTypeLabel = listingType => {
    const listingTypeConfig = listingTypes.find(config => config.listingType === listingType);
    return listingTypeConfig ? listingTypeConfig.label : listingType;
  };

  return hasMultipleListingTypes && !hasPredefinedListingType ? (
    <>
      <FieldSelect
        id={formId ? `${formId}.${name}` : name}
        name={name}
        className={css.listingTypeSelect}
        label={intl.formatMessage({ id: 'EditListingDetailsForm.listingTypeLabel' })}
        validate={required(
          intl.formatMessage({ id: 'EditListingDetailsForm.listingTypeRequired' })
        )}
        onChange={handleOnChange}
      >
        <option disabled value="">
          {intl.formatMessage({ id: 'EditListingDetailsForm.listingTypePlaceholder' })}
        </option>
        {listingTypes.map(config => {
          const type = config.listingType;
          return (
            <option key={type} value={type}>
              {config.label}
            </option>
          );
        })}
      </FieldSelect>
      <FieldHidden name="transactionProcessAlias" />
      <FieldHidden name="unitType" />
    </>
  ) : hasMultipleListingTypes && hasPredefinedListingType ? (
    <div className={css.listingTypeSelect}>
      <Heading as="h5" rootClassName={css.selectedLabel}>
        {intl.formatMessage({ id: 'EditListingDetailsForm.listingTypeLabel' })}
      </Heading>
      <p className={css.selectedValue}>{getListingTypeLabel(formApi.getFieldState(name)?.value)}</p>
      <FieldHidden name={name} />
      <FieldHidden name="transactionProcessAlias" />
      <FieldHidden name="unitType" />
    </div>
  ) : (
    <>
      <FieldHidden name={name} />
      <FieldHidden name="transactionProcessAlias" />
      <FieldHidden name="unitType" />
    </>
  );
};

// Finds the correct subcategory within the given categories array based on the provided categoryIdToFind.
const findCategoryConfig = (categories, categoryIdToFind) => {
  return categories?.find(category => category.id === categoryIdToFind);
};

/**
 * Recursively render subcategory field inputs if there are subcategories available.
 * This function calls itself with updated props to render nested category fields.
 * The select field is used for choosing a category or subcategory.
 */
const CategoryField = props => {
  const { currentCategoryOptions, level, values, prefix, handleCategoryChange, intl } = props;

  const currentCategoryKey = `${prefix}${level}`;

  const categoryConfig = findCategoryConfig(currentCategoryOptions, values[`${prefix}${level}`]);

  return (
    <>
      {currentCategoryOptions ? (
        <FieldSelect
          key={currentCategoryKey}
          id={currentCategoryKey}
          name={currentCategoryKey}
          className={css.listingTypeSelect}
          onChange={event => handleCategoryChange(event, level, currentCategoryOptions)}
          label={intl.formatMessage(
            { id: 'EditListingDetailsForm.categoryLabel' },
            { categoryLevel: currentCategoryKey }
          )}
          validate={required(
            intl.formatMessage(
              { id: 'EditListingDetailsForm.categoryRequired' },
              { categoryLevel: currentCategoryKey }
            )
          )}
        >
          <option disabled value="">
            {intl.formatMessage(
              { id: 'EditListingDetailsForm.categoryPlaceholder' },
              { categoryLevel: currentCategoryKey }
            )}
          </option>

          {currentCategoryOptions.map(option => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </FieldSelect>
      ) : null}

      {categoryConfig?.subcategories?.length > 0 ? (
        <CategoryField
          currentCategoryOptions={categoryConfig.subcategories}
          level={level + 1}
          values={values}
          prefix={prefix}
          handleCategoryChange={handleCategoryChange}
          intl={intl}
        />
      ) : null}
    </>
  );
};

const FieldSelectCategory = props => {
  useEffect(() => {
    checkIfInitialValuesExist();
  }, []);

  const { prefix, listingCategories, formApi, intl, setAllCategoriesChosen, values } = props;

  // Counts the number of selected categories in the form values based on the given prefix.
  const countSelectedCategories = () => {
    return Object.keys(values).filter(key => key.startsWith(prefix)).length;
  };

  // Checks if initial values exist for categories and sets the state accordingly.
  // If initial values exist, it sets `allCategoriesChosen` state to true; otherwise, it sets it to false
  const checkIfInitialValuesExist = () => {
    const count = countSelectedCategories(values, prefix);
    setAllCategoriesChosen(count > 0);
  };

  // If a parent category changes, clear all child category values
  const handleCategoryChange = (category, level, currentCategoryOptions) => {
    const selectedCatLenght = countSelectedCategories();
    if (level < selectedCatLenght) {
      for (let i = selectedCatLenght; i > level; i--) {
        formApi.change(`${prefix}${i}`, null);
      }
    }
    const categoryConfig = findCategoryConfig(currentCategoryOptions, category).subcategories;
    setAllCategoriesChosen(!categoryConfig || categoryConfig.length === 0);
  };

  return (
    <CategoryField
      currentCategoryOptions={listingCategories}
      level={1}
      values={values}
      prefix={prefix}
      handleCategoryChange={handleCategoryChange}
      intl={intl}
    />
  );
};

// Add collect data for listing fields (both publicData and privateData) based on configuration
const ROOM_KEYS = ['bedrooms', 'bathrooms', 'beds', 'guests', 'amenities', 'listingCategory'];

const AddListingFields = props => {
  const { listingType, listingFieldsConfig, selectedCategories, formId, intl } = props;
  const targetCategoryIds = Object.values(selectedCategories);

  const fields = listingFieldsConfig.reduce((pickedFields, fieldConfig) => {
    const { key, schemaType, scope } = fieldConfig || {};
    const namespacedKey = scope === 'public' ? `pub_${key}` : `priv_${key}`;

    // Skip room fields — they are handled by the RoomsAndSpaces component
    if (ROOM_KEYS.includes(key)) return pickedFields;

    const isKnownSchemaType = EXTENDED_DATA_SCHEMA_TYPES.includes(schemaType);
    const isProviderScope = ['public', 'private'].includes(scope);
    const isTargetListingType = isFieldForListingType(listingType, fieldConfig);
    const isTargetCategory = isFieldForCategory(targetCategoryIds, fieldConfig);

    return isKnownSchemaType && isProviderScope && isTargetListingType && isTargetCategory
      ? [
        ...pickedFields,
        <CustomExtendedDataField
          key={namespacedKey}
          name={namespacedKey}
          fieldConfig={fieldConfig}
          defaultRequiredMessage={intl.formatMessage({
            id: 'EditListingDetailsForm.defaultRequiredMessage',
          })}
          formId={formId}
        />,
      ]
      : pickedFields;
  }, []);

  return <>{fields}</>;
};

// ─── Amenities Configuration ───────────────────────────────────────────────

const REQUIRED_AMENITIES = [
  { key: 'security-24hr', label: '24-hour manned security' },
  { key: 'perimeter-wall', label: 'Perimeter wall + solid gate' },
  { key: 'alarm-panic', label: 'Alarm system + panic button' },
  { key: 'cctv', label: 'CCTV cameras' },
  { key: 'water-storage', label: 'Water storage tank / borehole' },
  { key: 'wifi', label: 'WiFi' },
  { key: 'secure-parking', label: 'Secure parking (min. 1 space)' },
  { key: 'kitchen', label: 'Kitchen' },
  { key: 'washing-machine', label: 'Washing machine' },
  { key: 'concierge', label: 'Concierge or estate management' },
  { key: 'hot-water', label: 'Hot water supply' },
  { key: 'furnished', label: 'Fully furnished' },
];

const PREMIUM_AMENITIES = [
  { key: 'generator', label: 'Backup generator or power' },
  { key: 'pool', label: 'Swimming pool' },
  { key: 'gym', label: 'Gym / fitness centre' },
  { key: 'rooftop', label: 'Rooftop or outdoor common area' },
  { key: 'balcony', label: 'Private patio or balcony' },
  { key: 'cleaning', label: 'Weekly cleaning service' },
];

const OPTIONAL_AMENITIES = [
  { key: 'tv', label: 'TV' },
  { key: 'pet-friendly', label: 'Pet-friendly' },
  { key: 'ac', label: 'Air conditioning' },
  { key: 'workspace', label: 'Dedicated workspace' },
];

const AmenityCheckbox = ({ amenityKey, label, checked, onChange }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 0',
  }}>
    <input
      type="checkbox"
      id={`amenity-${amenityKey}`}
      checked={checked}
      onChange={e => onChange(amenityKey, e.target.checked)}
      style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#5c3ebc' }}
    />
    <label htmlFor={`amenity-${amenityKey}`} style={{ fontSize: '15px', color: '#3d3d3d', cursor: 'pointer' }}>
      {label}
    </label>
  </div>
);

const PadlockIcon = () => (
  <svg className={css.submitHelpIcon} viewBox="0 0 24 24" aria-hidden="true">
  <rect x="3" y="11" width="18" height="11" rx="2" />
  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const AmenityGroup = ({
  title,
  badge,
  badgeColor,
  amenities,
  selected,
  onChange,
  isRequired,
  missingRequiredCount = 0,
}) => (
  <div style={{ marginBottom: '16px' }}>
    <div className={css.amenityGroupHeader}>
      <span className={css.amenityGroupLabel}>
        {title}
        {isRequired && <span style={{ color: '#e53e3e', marginLeft: '3px' }}>*</span>}
      </span>
      <span style={{
        fontSize: '11px',
        fontWeight: '700',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        padding: '2px 8px',
        borderRadius: '4px',
        background: badgeColor === 'red' ? '#fff0f0' : badgeColor === 'orange' ? '#fff7ed' : '#f0fdf4',
        color: badgeColor === 'red' ? '#e53e3e' : badgeColor === 'orange' ? '#c05621' : '#2f855a',
        border: `1px solid ${badgeColor === 'red' ? '#feb2b2' : badgeColor === 'orange' ? '#fbd38d' : '#9ae6b4'}`,
      }}>
        {badge}
      </span>
    </div>
    {isRequired && missingRequiredCount > 0 && (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 16px',
          background: '#fff5f5',
          border: '1px solid #feb2b2',
          borderRadius: '8px',
          margin: '0 0 16px 0',
        }}
      >
        <PadlockIcon />
        <p style={{ margin: 0, fontSize: '13px', color: '#c53030', fontWeight: '500' }}>
          {missingRequiredCount} required{' '}
          {missingRequiredCount === 1 ? 'amenity' : 'amenities'} — your listing
          does not qualify, if you don&apos;t have these amenities.
        </p>
      </div>
    )}
    <div style={{
      border: '1px solid #e0e0e0',
      borderRadius: '12px',
      padding: '0 20px',
      background: '#fff',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '0 24px',
    }}>
      {amenities.map((a, i) => {
        const isChecked = selected.includes(a.key);
        const showMissing = isRequired && !isChecked; // not being used at the moment
        return (
          <div key={a.key} style={{
            borderBottom: i < amenities.length - (amenities.length % 2 === 0 ? 2 : 1) ? '1px solid #f0f0f0' : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0' }}>
              <input
                type="checkbox"
                id={`amenity-${a.key}`}
                checked={isChecked}
                onChange={e => onChange(a.key, e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#5c3ebc', flexShrink: 0 }}
              />
              <label htmlFor={`amenity-${a.key}`} style={{
                fontSize: '15px',
                padding: 0,
                color: '#3d3d3d',
                cursor: 'pointer',
                flex: 1,
              }}>
                {a.label}
              </label>
              {isRequired && <PadlockIcon />}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const QualificationModal = ({ selected, onClose }) => {
  const requiredKeys = REQUIRED_AMENITIES.map(a => a.key);
  const missing = REQUIRED_AMENITIES.filter(a => !selected.includes(a.key));
  const qualifies = missing.length === 0;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: '16px', padding: '32px',
        maxWidth: '480px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: '40px', textAlign: 'center', marginBottom: '12px' }}>
          {qualifies ? '✅' : '❌'}
        </div>
        <h2 style={{ textAlign: 'center', fontSize: '20px', fontWeight: '700', marginBottom: '8px', color: '#1a1a1a' }}>
          {qualifies ? 'Your listing qualifies!' : 'Not quite there yet'}
        </h2>
        <p style={{ textAlign: 'center', fontSize: '14px', color: '#666', marginBottom: '20px' }}>
          {qualifies
            ? 'Great — your listing meets all required amenity standards.'
            : `You are missing ${missing.length} required amenit${missing.length > 1 ? 'ies' : 'y'}:`}
        </p>
        {!qualifies && (
          <ul style={{ listStyle: 'none', padding: 0, marginBottom: '20px' }}>
            {missing.map(a => (
              <li key={a.key} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 12px', background: '#fff5f5', borderRadius: '8px',
                marginBottom: '6px', fontSize: '14px', color: '#c53030',
              }}>
                <span>✗</span> {a.label}
              </li>
            ))}
          </ul>
        )}
        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '12px', background: '#5c3ebc',
            color: '#fff', border: 'none', borderRadius: '8px',
            fontSize: '15px', fontWeight: '600', cursor: 'pointer',
          }}
        >
          {qualifies ? 'Continue' : 'Go back and add them'}
        </button>
      </div>
    </div>
  );
};

const AmenitiesSection = ({ formApi, values, missingRequiredCount }) => {
  const [showModal, setShowModal] = useState(false);
  const selected = values.pub_amenities || [];

  const handleChange = (key, checked) => {
    const current = values.pub_amenities || [];
    const updated = checked ? [...current, key] : current.filter(k => k !== key);
    formApi.change('pub_amenities', updated);
  };

  return (
    <div style={{ marginBottom: '32px' }}>
      <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '6px', color: '#1a1a1a' }}>
        Amenities
      </h2>

      <AmenityGroup
        title="Required Amenities"
        badge="MUST HAVE"
        badgeColor="red"
        amenities={REQUIRED_AMENITIES}
        selected={selected}
        onChange={handleChange}
        isRequired={true}
        missingRequiredCount={missingRequiredCount}
      />
      <AmenityGroup
        title="Premium Amenities"
        badge="BOOSTS LISTING"
        badgeColor="orange"
        amenities={PREMIUM_AMENITIES}
        selected={selected}
        onChange={handleChange}
        isRequired={false}
      />
      <AmenityGroup
        title="Optional Amenities"
        badge="NICE TO HAVE"
        badgeColor="green"
        amenities={OPTIONAL_AMENITIES}
        selected={selected}
        onChange={handleChange}
        isRequired={false}
      />

      {showModal && (
        <QualificationModal selected={selected} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
};

// Return configuration for given listingType
const getListingTypeConfig = (config, listingType) => {
  return config.listing.listingTypes?.find(config => config.listingType === listingType);
};

const renderRequiredLabel = (label, asteriskClassName) => (
  <>
    {label}
    <span className={asteriskClassName}> *</span>
  </>
);

// Listing type toggle buttons (Entire Home / Room)
const ListingTypeButtons = ({
  formId,
  intl,
  listingTypes,
  formApi,
  onListingTypeChange,
}) => {
  const options = listingTypes?.length > 0
    ? listingTypes.map(config => ({ key: config.listingType, label: config.label }))
    : [
      { key: 'entire-home', label: intl.formatMessage({ id: 'EditListingDetailsForm.listingCategoryEntireHome', defaultMessage: 'Entire Home' }) },
      { key: 'room', label: intl.formatMessage({ id: 'EditListingDetailsForm.listingCategoryRoom', defaultMessage: 'Room' }) },
    ];

  const handleSelect = value => {
    const selectedConfig = listingTypes?.find(c => c.listingType === value);
    formApi.change('listingType', value);

    if (selectedConfig) {
      formApi.change('transactionProcessAlias', selectedConfig.transactionProcessAlias);
      formApi.change('unitType', selectedConfig.unitType);
    }

    if (onListingTypeChange && selectedConfig) {
      onListingTypeChange(selectedConfig);
    }
  };

  useEffect(() => {
    const currentListingType = formApi.getFieldState('listingType')?.value;

    if (currentListingType) {
      const selectedConfig = listingTypes?.find(c => c.listingType === currentListingType);

      if (onListingTypeChange && selectedConfig) {
        onListingTypeChange(selectedConfig);
      }
    } else if (options.length > 0) {
      handleSelect(options[0].key);
    }
  }, []);


  return (
    <div className={css.listingTypeSection}>
      <Heading as="h5" rootClassName={css.sectionLabel}>
        {renderRequiredLabel(
          intl.formatMessage({
            id: 'EditListingDetailsForm.listingCategoryLabel',
            defaultMessage: 'Listing type',
          }),
          css.requiredAsterisk
        )}
      </Heading>
      <div className={css.listingTypeButtons}>
        <Field name="listingType">
          {({ input }) =>
            options.map(opt => (
              <button
                key={opt.key}
                type="button"
                className={classNames(css.listingTypeButton, {
                  [css.listingTypeButtonActive]: input.value === opt.key,
                })}
                onClick={() => handleSelect(opt.key)}
              >
                {opt.label}
              </button>
            ))
          }
        </Field>
        <FieldHidden name="transactionProcessAlias" />
        <FieldHidden name="unitType" />
      </div>
    </div>
  );
};

// Rooms & spaces counter section
const bedroomLabel = (count, intl) => {
  const labels = {
    0: intl.formatMessage({ id: 'EditListingDetailsForm.studioBadge', defaultMessage: 'Studio' }),
    1: intl.formatMessage({ id: 'EditListingDetailsForm.oneBedroom', defaultMessage: 'One Bedroom' }),
    2: intl.formatMessage({ id: 'EditListingDetailsForm.twoBedrooms', defaultMessage: 'Two Bedrooms' }),
    3: intl.formatMessage({ id: 'EditListingDetailsForm.threeBedrooms', defaultMessage: 'Three Bedrooms' }),
    4: intl.formatMessage({ id: 'EditListingDetailsForm.fourBedrooms', defaultMessage: 'Four Bedrooms' }),
    5: intl.formatMessage({ id: 'EditListingDetailsForm.fiveBedrooms', defaultMessage: 'Five Bedrooms' }),
  };
  return labels[count] || `${count} Bedrooms`;
};

const RoomsAndSpaces = ({ formId, intl, bedroomsValue }) => {
  const count = bedroomsValue != null ? Number(bedroomsValue) : 0;
  const isStudio = count === 0;
  const badgeText = bedroomLabel(count, intl);

  return (
    <div className={css.roomsSection}>
      <Heading as="h5" rootClassName={css.sectionLabel}>
        {renderRequiredLabel(
          intl.formatMessage({
            id: 'EditListingDetailsForm.roomsAndSpacesLabel',
            defaultMessage: 'Rooms & spaces',
          }),
          css.requiredAsterisk
        )}
      </Heading>
      <div className={css.roomsContainer}>
        <div className={css.roomRow}>
          <span className={css.roomLabel}>
            {intl.formatMessage({ id: 'EditListingDetailsForm.bedroomsLabel', defaultMessage: 'Bedrooms' })}
            <span className={isStudio ? css.studioBadge : css.bedroomBadge}>
              {badgeText}
            </span>
          </span>
          <FieldNumber
            id={`${formId}pub_bedrooms`}
            name="pub_bedrooms"
            minValue={0}
            maxValue={20}
          />
        </div>
        <div className={css.roomRow}>
          <span className={css.roomLabel}>
            {intl.formatMessage({ id: 'EditListingDetailsForm.bathroomsLabel', defaultMessage: 'Bathrooms' })}
          </span>
          <FieldNumber
            id={`${formId}pub_bathrooms`}
            name="pub_bathrooms"
            minValue={0}
            maxValue={20}
            initialValue={1}
          />
        </div>
        <div className={css.roomRow}>
          <span className={css.roomLabel}>
            {intl.formatMessage({ id: 'EditListingDetailsForm.bedsLabel', defaultMessage: 'Beds' })}
          </span>
          <FieldNumber
            id={`${formId}pub_beds`}
            name="pub_beds"
            minValue={0}
            maxValue={50}
            initialValue={1}
          />
        </div>
        <div className={css.roomRow}>
          <span className={css.roomLabel}>
            {intl.formatMessage({ id: 'EditListingDetailsForm.guestsLabel', defaultMessage: 'Guests' })}
          </span>
          <FieldNumber
            id={`${formId}pub_guests`}
            name="pub_guests"
            minValue={1}
            maxValue={50}
            initialValue={1}
          />
        </div>
      </div>
    </div>
  );
};



/**
 * Form that asks title, description, transaction process and unit type for pricing
 * In addition, it asks about custom fields according to marketplace-custom-config.js
 *
 * @component
 * @param {Object} props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.formId] - The form id
 * @param {boolean} props.disabled - Whether the form is disabled
 * @param {boolean} props.ready - Whether the form is ready
 * @param {boolean} props.updated - Whether the form is updated
 * @param {boolean} props.updateInProgress - Whether the update is in progress
 * @param {Object} props.fetchErrors - The fetch errors object
 * @param {propTypes.error} [props.fetchErrors.createListingDraftError] - The create listing draft error
 * @param {propTypes.error} [props.fetchErrors.showListingsError] - The show listings error
 * @param {propTypes.error} [props.fetchErrors.updateListingError] - The update listing error
 * @param {Function} props.pickSelectedCategories - The pick selected categories function
 * @param {Array<Object>} props.selectableListingTypes - The selectable listing types
 * @param {boolean} props.hasPredefinedListingType - Whether the listing type is already saved or predefined through URL
 * @param {propTypes.listingFields} props.listingFieldsConfig - The listing fields config
 * @param {string} props.listingCurrency - The listing currency
 * @param {string} props.saveActionMsg - The save action message
 * @param {boolean} [props.autoFocus] - Whether the form should autofocus
 * @param {Function} props.onListingTypeChange - The listing type change function
 * @param {Function} props.onSubmit - The submit function
 * @returns {JSX.Element}
 */
const EditListingDetailsForm = props => (
  <FinalForm
    {...props}
    mutators={{ ...arrayMutators }}
    render={formRenderProps => {
      const {
        autoFocus,
        className,
        disabled,
        ready,
        formId = 'EditListingDetailsForm',
        form: formApi,
        handleSubmit,
        onListingTypeChange,
        invalid,
        pristine,
        marketplaceCurrency,
        marketplaceName,
        selectableListingTypes,
        selectableCategories,
        hasPredefinedListingType = false,
        pickSelectedCategories,
        categoryPrefix,
        saveActionMsg,
        updated,
        updateInProgress,
        fetchErrors,
        listingFieldsConfig = [],
        listingCurrency,
        values,
      } = formRenderProps;

      const intl = useIntl();
      const { listingType, transactionProcessAlias, unitType } = values;
      const [allCategoriesChosen, setAllCategoriesChosen] = useState(false);
      const titleRequiredMessage = intl.formatMessage({
        id: 'EditListingDetailsForm.titleRequired',
      });
      const maxLengthMessage = intl.formatMessage(
        { id: 'EditListingDetailsForm.maxLength' },
        {
          maxLength: TITLE_MAX_LENGTH,
        }
      );

      // Determine the currency to validate:
      // - If editing an existing listing, use the listing's currency.
      // - If creating a new listing, fall back to the default marketplace currency.
      const currencyToCheck = listingCurrency || marketplaceCurrency;

      // Verify if the selected listing type's transaction process supports the chosen currency.
      // This checks compatibility between the transaction process
      // and the marketplace or listing currency.
      const isCompatibleCurrency = isValidCurrencyForTransactionProcess(
        transactionProcessAlias,
        currencyToCheck
      );

      const maxLength60Message = maxLength(maxLengthMessage, TITLE_MAX_LENGTH);

      const hasCategories = selectableCategories && selectableCategories.length > 0;
      const showCategories = listingType && hasCategories;
      const needsCategorySelection = showCategories && !allCategoriesChosen;

      const showTitle = hasCategories ? allCategoriesChosen : listingType;

      const config = useConfiguration();
      const listingTypeConfig = getListingTypeConfig(config, listingType);
      const showDescriptionMaybe = displayDescription(listingTypeConfig);
      const showDescription = hasCategories
        ? allCategoriesChosen && showDescriptionMaybe
        : showDescriptionMaybe;

      const showListingFields = hasCategories ? allCategoriesChosen : listingType;

      const classes = classNames(css.root, className);
      const submitReady = (updated && pristine) || ready;
      const submitInProgress = updateInProgress;
      const hasMandatoryListingTypeData = listingType && transactionProcessAlias && unitType;

      // Check all required amenities are selected
      const selectedAmenities = values.pub_amenities || [];
      const requiredAmenityKeys = REQUIRED_AMENITIES.map(a => a.key);
      const hasAllRequiredAmenities = requiredAmenityKeys.every(k =>
        selectedAmenities.includes(k)
      );
      const missingRequiredCount = requiredAmenityKeys.filter(
        k => !selectedAmenities.includes(k)
      ).length;

      // All required fields must be filled before Next is enabled
      const hasTitle = values.title && values.title.trim().length > 0;
      const hasDescription = values.description && values.description.trim().length > 0;

      const submitDisabled =
        invalid ||
        disabled ||
        submitInProgress ||
        !hasMandatoryListingTypeData ||
        !isCompatibleCurrency ||
        !hasAllRequiredAmenities ||
        !hasTitle ||
        !hasDescription;

      const missingRequirements = [];

      if (!hasMandatoryListingTypeData) {
        missingRequirements.push(
          intl.formatMessage({ id: 'EditListingDetailsForm.missingListingType' })
        );
      }

      if (needsCategorySelection) {
        missingRequirements.push(
          intl.formatMessage({ id: 'EditListingDetailsForm.missingCategory' })
        );
      }

      if (!hasTitle) {
        missingRequirements.push(intl.formatMessage({ id: 'EditListingDetailsForm.missingTitle' }));
      }

      if (!hasDescription) {
        missingRequirements.push(
          intl.formatMessage({ id: 'EditListingDetailsForm.missingDescription' })
        );
      }

      if (!hasAllRequiredAmenities) {
        missingRequirements.push(
          intl.formatMessage(
            { id: 'EditListingDetailsForm.missingAmenities' },
            { count: missingRequiredCount }
          )
        );
      }

      if (!isCompatibleCurrency && listingType) {
        missingRequirements.push(
          intl.formatMessage({ id: 'EditListingDetailsForm.missingCompatibleCurrency' })
        );
      }

      const submitHelpIntro =
        submitDisabled && missingRequirements.length > 0
          ? intl.formatMessage({ id: 'EditListingDetailsForm.submitHelpIntro' })
          : null;

      const submitHelpItems =
        submitDisabled && missingRequirements.length > 0
          ? missingRequirements.join(', ')
          : null;

      return (
        <Form className={classes} onSubmit={handleSubmit}>
          <ErrorMessage fetchErrors={fetchErrors} />

          <ListingTypeButtons
            formId={formId}
            intl={intl}
            listingTypes={selectableListingTypes}
            formApi={formApi}
            onListingTypeChange={onListingTypeChange}
          />

          <RoomsAndSpaces formId={formId} intl={intl} bedroomsValue={values.pub_bedrooms} />

          {showCategories && isCompatibleCurrency && (
            <FieldSelectCategory
              values={values}
              prefix={categoryPrefix}
              listingCategories={selectableCategories}
              formApi={formApi}
              intl={intl}
              allCategoriesChosen={allCategoriesChosen}
              setAllCategoriesChosen={setAllCategoriesChosen}
            />
          )}

          {showTitle && isCompatibleCurrency && (
            <FieldTextInput
              id={`${formId}title`}
              name="title"
              className={css.title}
              type="text"
              label={renderRequiredLabel(
                intl.formatMessage({ id: 'EditListingDetailsForm.title' }),
                css.requiredAsterisk
              )}
              placeholder={intl.formatMessage({
                id: 'EditListingDetailsForm.titlePlaceholder',
              })}
              maxLength={TITLE_MAX_LENGTH}
              validate={composeValidators(required(titleRequiredMessage), maxLength60Message)}
            />
          )}

          {showDescription && isCompatibleCurrency && (
            <FieldTextInput
              id={`${formId}description`}
              name="description"
              className={css.description}
              type="textarea"
              label={renderRequiredLabel(
                intl.formatMessage({ id: 'EditListingDetailsForm.description' }),
                css.requiredAsterisk
              )}
              placeholder={intl.formatMessage({
                id: 'EditListingDetailsForm.descriptionPlaceholder',
              })}
              validate={required(
                intl.formatMessage({
                  id: 'EditListingDetailsForm.descriptionRequired',
                })
              )}
            />
          )}

          {showListingFields && isCompatibleCurrency && (
            <AddListingFields
              listingType={listingType}
              listingFieldsConfig={listingFieldsConfig}
              selectedCategories={pickSelectedCategories(values)}
              formId={formId}
              intl={intl}
            />
          )}

          <AmenitiesSection formApi={formApi} values={values} missingRequiredCount={missingRequiredCount} />


          {!isCompatibleCurrency && listingType && (
            <p className={css.error}>
              <FormattedMessage
                id="EditListingDetailsForm.incompatibleCurrency"
                values={{ marketplaceName, marketplaceCurrency }}
              />
            </p>
          )}

          {submitHelpIntro && submitHelpItems ? (
            <div className={css.submitHelpCallout}>
              <svg className={css.submitHelpIcon} viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <p className={css.submitHelpText}>
                <span className={css.submitHelpIntro}>{submitHelpIntro}</span>{' '}
                {submitHelpItems}
              </p>
            </div>
          ) : null}


          <Button
            className={css.submitButton}
            type="submit"
            inProgress={submitInProgress}
            disabled={submitDisabled}
            ready={submitReady}
          >
            {saveActionMsg}
          </Button>
        </Form>
      );
    }}
  />
);

export default EditListingDetailsForm;
