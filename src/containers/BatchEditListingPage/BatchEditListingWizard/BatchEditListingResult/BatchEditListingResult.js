import React, { useEffect, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';

import { getSaveListingData, RESET_STATE } from '../../BatchEditListingPage.duck';
import { createResourceLocatorString } from '../../../../util/routes';
import { LISTING_TAB_TYPES } from '../../../../util/types';
import { Button, Result } from 'antd';
import css from '../BatchEditListingWizard.module.css';

export const BatchEditListingResult = props => {
  const { routeConfiguration, history } = props;
  const dispatch = useDispatch();
  const intl = useIntl();
  const { failedListings, successfulListings } = useSelector(getSaveListingData);
  const resultErrorTitle = intl.formatMessage({ id: 'BatchEditListingResult.result.error.title' });
  const resultSuccessTitle = intl.formatMessage({
    id: 'BatchEditListingResult.result.success.title',
  });
  const resultErrorDescription = intl.formatMessage({
    id: 'BatchEditListingResult.result.error.description',
  });
  const resultSuccessDescription = intl.formatMessage({
    id: 'BatchEditListingResult.result.success.description',
  });

  useEffect(() => {
    // Reset state when component unmounts
    return () => {
      dispatch({ type: RESET_STATE });
    };
  }, []);

  const { status, title, subtitle } = useMemo(() => {
    if (successfulListings.length > 0) {
      return failedListings.length > 0
        ? {
            status: 'warning',
            title: resultErrorTitle,
            subtitle: resultErrorDescription,
          }
        : {
            status: 'success',
            title: resultSuccessTitle,
            subtitle: resultSuccessDescription,
          };
    }

    return {
      status: 'error',
      title: 'All listings failed to publish',
      subtitle: 'Please check the listings and try again.',
    };
  }, [successfulListings, failedListings]);

  const redirectTo = (destination = 'ManageListingsPage', params = {}) => {
    dispatch({ type: RESET_STATE });
    const searchParams = { pub_listingType: LISTING_TAB_TYPES.PRODUCT };
    const to = createResourceLocatorString(destination, routeConfiguration, params, searchParams);
    history.push(to);
  };

  return (
    <Result
      className={css.results}
      status={status}
      title={title}
      subTitle={subtitle}
      extra={[
        <Button type="primary" key="console" onClick={() => redirectTo('ManageListingsPage')}>
          View listings
        </Button>,
      ]}
    />
  );
};
