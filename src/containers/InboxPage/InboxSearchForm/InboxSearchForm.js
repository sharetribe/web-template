import React from 'react';
import { useLocation } from 'react-router-dom';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

import { FormattedMessage } from '../../../util/reactIntl';
import { parse, getValidInboxSort } from '../../../util/urlHelpers';
import { Form } from '../../../components';

import css from './InboxSearchForm.module.css';
import InboxSortBy from './InboxSortBy';

const isEmptySort = sort => sort.constructor === Object && Object.keys(sort).length === 0;

/**
 * InboxSearchForm component
 *
 * Class for all inbox sorting/filtering options - customizations should be added here.
 * Currently only contains sorting functionality.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.rootClassName] - Custom class that extends the default class for the root element
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {intlShape} props.intl - The intl object
 * @returns {JSX.Element}
 */
const InboxSearchForm = props => {
  const { intl, onSelect } = props;

  const location = useLocation();
  const searchParams = parse(location.search);
  const validSort = getValidInboxSort(searchParams.sort);
  const initialValue = !isEmptySort(validSort) ? searchParams.sort : 'createdAt';

  return (
    <FinalForm
      {...props}
      render={formRenderProps => {
        const { rootClassName, className, handleSubmit } = formRenderProps;
        const classes = classNames(rootClassName || css.root, className);

        return (
          <Form onSubmit={handleSubmit} className={classes}>
            <div className={css.sortyByWrapper}>
              <span className={css.sortyBy}>
                <FormattedMessage id="InboxSearchForm.sortLabel" />
              </span>
              <InboxSortBy intl={intl} onSelect={onSelect} initialValue={initialValue} />
            </div>
          </Form>
        );
      }}
    />
  );
};

export default InboxSearchForm;
