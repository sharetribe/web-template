import { H3 } from '../../../../components';
import { FormattedMessage } from '../../../../util/reactIntl';
import React from 'react';
import EditPortfolioListingForm from './EditPortfolioListingForm';
import css from './EditPortfolioListingDetailsPanel.module.css';
import classNames from 'classnames';
import { Skeleton } from 'antd';

export const EditPortfolioListingDetailsPanel = props => {
  const { className, onSubmit, config, isLoading } = props;
  const classes = classNames(className || css.root, className);

  return (
    <div className={classes}>
      <H3 as="h1">
        <FormattedMessage
          id="EditPortfolioListingDetailsPanel.title"
          defaultMessage="Portfolio Details"
        ></FormattedMessage>
        {isLoading ? (
          <div className={css.skeleton}>
            <Skeleton.Input block size="large" active></Skeleton.Input>
          </div>
        ) : (
          <EditPortfolioListingForm onSubmit={onSubmit} config={config}></EditPortfolioListingForm>
        )}
      </H3>
    </div>
  );
};
