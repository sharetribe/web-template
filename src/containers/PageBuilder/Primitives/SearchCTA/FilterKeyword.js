import React from 'react';
import classNames from 'classnames';
import { FieldTextInput } from '../../../../components';
import { useIntl } from '../../../../util/reactIntl';

import css from './FilterKeyword.module.css';

const FilterKeyword = props => {
  const intl = useIntl();
  const { className, rootClassName } = props;
  const rootClass = rootClassName || css.root;
  const classes = classNames(rootClass, className);

  return (
    <div className={classes}>
      <FieldTextInput
        className={css.customField}
        name={'keywords'}
        type="text"
        placeholder={intl.formatMessage({
          id: 'SearchCTA.keywordFilterPlaceholder',
        })}
      />
    </div>
  );
};

export default FilterKeyword;
