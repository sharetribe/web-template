import React from 'react';
import { withRouter } from 'react-router-dom';

import { stringify, parse } from '../../../util/urlHelpers';
import { fakeIntl } from '../../../util/testData';

import SeatsFilter from './SeatsFilter';

const URL_PARAM = 'seats';

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

const SeatsFilterPopup = withRouter(props => {
  const { history, location } = props;

  const params = parse(location.search);
  const seats = params[URL_PARAM];
  const initialValues = !!seats ? { [URL_PARAM]: seats } : { [URL_PARAM]: null };

  return (
    <SeatsFilter
      id="SeatsFilterPopupExample"
      name="seats"
      queryParamNames={[URL_PARAM]}
      label="Seats:"
      getAriaLabel={getAriaLabel}
      onSubmit={values => handleSubmit(values, history)}
      showAsPopup={true}
      liveEdit={false}
      initialValues={initialValues}
      contentPlacementOffset={-14}
    />
  );
});

export const SeatsFilterPopupExample = {
  component: SeatsFilterPopup,
  props: {},
  group: 'page:SearchPage',
};

const SeatsFilterPlain = withRouter(props => {
  const { history, location } = props;

  const params = parse(location.search);
  const seats = params[URL_PARAM];
  const initialValues = !!seats ? { [URL_PARAM]: seats } : { [URL_PARAM]: null };

  return (
    <SeatsFilter
      id="SeatsFilterPlainExample"
      name="seats"
      queryParamNames={[URL_PARAM]}
      label="Seats"
      getAriaLabel={getAriaLabel}
      onSubmit={values => {
        handleSubmit(values, history);
      }}
      showAsPopup={false}
      liveEdit={true}
      initialValues={initialValues}
    />
  );
});

export const SeatsFilterPlainExample = {
  component: SeatsFilterPlain,
  props: {},
  group: 'page:SearchPage',
};
