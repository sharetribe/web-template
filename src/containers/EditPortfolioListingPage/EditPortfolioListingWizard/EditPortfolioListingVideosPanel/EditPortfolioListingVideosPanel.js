import { H3 } from '../../../../components';
import { FormattedMessage } from '../../../../util/reactIntl';
import React from 'react';
import classNames from 'classnames';
import css from './EditPortfolioListingVideosPanel.module.css';
import EditPortfolioListingVideosForm from './EditPortfolioListingVideosForm';
import { Skeleton } from 'antd';

export const EditPortfolioListingVideosPanel = ({ className, config, onSubmit, isLoading }) => {
  return (
    <div className={classNames(css.root, className)}>
      <H3 as="h1">
        <FormattedMessage
          id="EditPortfolioListingVideosPanel.title"
          defaultMessage="Portfolio Videos"
        />
      </H3>

      {isLoading ? (
        <Skeleton.Node active style={{ width: 460, height: 460 }} />
      ) : (
        <EditPortfolioListingVideosForm className={css.form} config={config} onSubmit={onSubmit} />
      )}
    </div>
  );
};
