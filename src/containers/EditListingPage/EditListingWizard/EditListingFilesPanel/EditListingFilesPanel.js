import React from 'react';
import classNames from 'classnames';

import EditListingFilesForm from './EditListingFilesForm';
import css from './EditListingFilesPanel.module.css';

const EditListingFilesPanel = props => {
  const {
    className,
    rootClassName,
    errors,
    disabled,
    ready,
    listing,
    submitButtonText,
    panelUpdated,
    updateInProgress,
    onSubmit,
    updatePageTitle: UpdatePageTitle,
    intl,
  } = props;

  const classes = classNames(rootClassName || css.root, className);

  return (
    <main className={classes}>
      <EditListingFilesForm
        className={css.form}
        disabled={disabled}
        ready={ready}
        fetchErrors={errors}
        initialValues={{}}
        onSubmit={onSubmit}
        saveActionMsg={submitButtonText}
        updated={panelUpdated}
        updateInProgress={updateInProgress}
      />
    </main>
  );
};

export default EditListingFilesPanel;
