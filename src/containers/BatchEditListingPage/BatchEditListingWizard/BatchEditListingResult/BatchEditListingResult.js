import { useDispatch, useSelector } from 'react-redux';
import { getSaveListingData, RESET_STATE } from '../../BatchEditListingPage.duck';
import React, { useEffect, useMemo } from 'react';
import { createResourceLocatorString } from '../../../../util/routes';
import { Button, Result } from 'antd';
import css from '../BatchEditListingWizard.module.css';

export const BatchEditListingResult = props => {
  const { routeConfiguration, history } = props;
  const dispatch = useDispatch();
  const { failedListings, successfulListings, selectedRowsKeys } = useSelector(getSaveListingData);

  useEffect(() => {
    // Reset state when component unmounts
    return () => {
      dispatch({ type: RESET_STATE });
    };
  }, []);

  const { status, title, subtitle } = useMemo(() => {
    if (successfulListings.length > 0 && failedListings.length > 0) {
      return {
        status: 'warning',
        title: 'Some listings failed to publish',
        subtitle: 'Please check the listings and try again.',
      };
    }

    if (successfulListings.length === selectedRowsKeys.length) {
      return {
        status: 'success',
        title: 'All Set! Listings Submitted for Review',
        subtitle:
          'Thank you for submitting your listings. Our team will review them shortly. You can check the status in your dashboard.',
      };
    }

    return {
      status: 'error',
      title: 'All listings failed to publish',
      subtitle: 'Please check the listings and try again.',
    };
  }, [successfulListings, failedListings, selectedRowsKeys]);

  const redirectTo = (destination = 'ManageListingsPage', params = {}) => {
    dispatch({ type: RESET_STATE });
    const to = createResourceLocatorString(destination, routeConfiguration, params);
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
