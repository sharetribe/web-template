import { H3 } from '../../../../components';
import { FormattedMessage } from '../../../../util/reactIntl';
import React from 'react';
import classNames from 'classnames';
import css from './EditPortfolioListingItemsPanel.module.css';
import EditPortfolioListingFilesForm from './EditPortfolioListingFilesForm';
import { Skeleton } from 'antd';

export const EditPortfolioListingItemsPanel = ({
  className,
  config,
  onUpdateListing,
  isLoading,
}) => {
  return (
    <div className={classNames(css.root, className)}>
      <H3 as="h1">
        <FormattedMessage
          id="EditPortfolioListingItemsPanel.title"
          defaultMessage="Portfolio Items"
        />
      </H3>

      {isLoading ? (
        <Skeleton.Node active style={{ width: 460, height: 460 }} />
      ) : (
        <EditPortfolioListingFilesForm
          className={css.form}
          config={config}
          onUpdateListing={onUpdateListing}
        />
      )}
    </div>
  );
};
