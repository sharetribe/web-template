import React from 'react';
import { withRouter } from 'react-router-dom';
import { stringify, parse } from '../../../util/urlHelpers';
import { fakeIntl } from '../../../util/testData';
import { SCHEMA_TYPE_MULTI_ENUM } from '../../../util/types';
import SelectMultipleFilter from './SelectMultipleFilter';

const URL_PARAM = 'pub_amenities';

const options = [
  {
    option: 'towels',
    label: 'Towels',
  },
  {
    option: 'bathroom',
    label: 'Bathroom',
  },
  {
    option: 'swimming_pool',
    label: 'Swimming pool',
  },
  {
    option: 'own_drinks',
    label: 'Own drinks allowed',
  },
  {
    option: 'jacuzzi',
    label: 'Jacuzzi',
  },
  {
    option: 'audiovisual_entertainment',
    label: 'Audiovisual entertainment',
  },
  {
    option: 'barbeque',
    label: 'Barbeque',
  },
  {
    option: 'own_food_allowed',
    label: 'Own food allowed',
  },
];

const handleSubmit = (values, history) => {
  console.log('Submitting values', values);
  const queryParams = values ? `?${stringify(values)}` : '';
  history.push(`${window.location.pathname}${queryParams}`);
};

const getAriaLabel = (label, values) => {
  const status = values ? 'active' : 'inactive';
  return fakeIntl.formatMessage(
    { id: 'SearchPage.screenreader.openFilterButton' },
    { label, status, values }
  );
};

const AmenitiesFilterPopup = withRouter(props => {
  const { history, location } = props;

  const params = parse(location.search);
  const amenities = params[URL_PARAM];
  const initialValues = { [URL_PARAM]: !!amenities ? amenities : null };

  return (
    <SelectMultipleFilter
      id="SelectMultipleFilterPopupExample"
      name="amenities"
      queryParamNames={[URL_PARAM]}
      label="Amenities"
      getAriaLabel={getAriaLabel}
      onSubmit={values => handleSubmit(values, history)}
      showAsPopup={true}
      liveEdit={false}
      options={options}
      schemaType={SCHEMA_TYPE_MULTI_ENUM}
      initialValues={initialValues}
      contentPlacementOffset={-14}
    />
  );
});

export const AmenitiesFilterPopupExample = {
  component: AmenitiesFilterPopup,
  props: {},
  group: 'page:SearchPage',
};

const AmenitiesFilterPlain = withRouter(props => {
  const { history, location } = props;

  const params = parse(location.search);
  const amenities = params[URL_PARAM];
  const initialValues = { [URL_PARAM]: !!amenities ? amenities : null };

  return (
    <SelectMultipleFilter
      id="SelectMultipleFilterPlainExample"
      name="amenities"
      queryParamNames={[URL_PARAM]}
      label="Amenities"
      getAriaLabel={getAriaLabel}
      onSubmit={values => {
        handleSubmit(values, history);
      }}
      showAsPopup={false}
      liveEdit={true}
      options={options}
      schemaType={SCHEMA_TYPE_MULTI_ENUM}
      initialValues={initialValues}
    />
  );
});

export const AmenitiesFilterPlainExample = {
  component: AmenitiesFilterPlain,
  props: {},
  group: 'page:SearchPage',
};
