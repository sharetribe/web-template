import React, { Component } from 'react';
import { bool, func, node, object, string } from 'prop-types';
import classNames from 'classnames';

import { FormattedMessage, injectIntl, intlShape } from '../../../util/reactIntl';

import IconPlus from '../IconPlus/IconPlus';
import FilterForm from '../FilterForm/FilterForm';

import css from './FilterPlain.module.css';

class FilterPlainComponent extends Component {
  constructor(props) {
    super(props);

    // Filters to initialize as closed
    const closedFilters = [
      'SearchFiltersDesktop.marki.plain',
      'SearchFiltersDesktop.cvetove.plain',
      'SearchFiltersDesktop.dizaierski_marki.plain'
    ];

    // Set the initial state dynamically
    this.state = {
      isOpen: !closedFilters.includes(props.id), // Closed if id is in the list
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleClear = this.handleClear.bind(this);
    this.toggleIsOpen = this.toggleIsOpen.bind(this);
  }

  handleChange(values) {
    const { onSubmit } = this.props;
    onSubmit(values);
  }

  handleClear() {
    const { onSubmit, onClear } = this.props;

    if (onClear) {
      onClear();
    }

    onSubmit(null);
  }

  toggleIsOpen() {
    this.setState(prevState => ({ isOpen: !prevState.isOpen }));
  }

  render() {
    const {
      rootClassName,
      className,
      plainClassName,
      id,
      intl,
      label,
      labelSelection,
      labelSelectionSeparator,
      isSelected,
      children,
      initialValues,
      keepDirtyOnReinitialize,
      showSearch,
      onSearch,
    } = this.props;
    const classes = classNames(rootClassName || css.root, className);

    return (
      <div className={classes}>
        <div className={css.filterHeader}>
          <button className={css.labelButton} onClick={this.toggleIsOpen}>
            <span className={css.labelButtonContent}>
              <span className={css.labelWrapper}>
                <span className={css.label}>
                  {label}
                  {labelSelection && labelSelectionSeparator ? labelSelectionSeparator : null}
                  {labelSelection ? (
                    <span className={css.labelSelected}>{labelSelection}</span>
                  ) : null}
                </span>
              </span>
              <span className={css.openSign}>
                <IconPlus isOpen={this.state.isOpen} isSelected={isSelected} />
              </span>
            </span>
          </button>
        </div>
        <div
          id={id}
          className={classNames(plainClassName, css.plain, { [css.isOpen]: this.state.isOpen })}
          ref={node => {
            this.filterContent = node;
          }}
        >
          {showSearch && (
            <div>
              <input
                onChange={e => onSearch(e.target.value)}
                type="text"
                placeholder={intl.formatMessage({
                  id: 'TopbarSearchForm.placeholder',
                })}
                autoComplete="off"
                />
            </div>
          )}
          <FilterForm
            id={`${id}.form`}
            liveEdit
            onChange={this.handleChange}
            initialValues={initialValues}
            keepDirtyOnReinitialize={keepDirtyOnReinitialize}
          >
            {children}
          </FilterForm>
          <button className={css.clearButton} onClick={this.handleClear}>
            <FormattedMessage id={'FilterPlain.clear'} />
          </button>
        </div>
      </div>
    );
  }
}

FilterPlainComponent.defaultProps = {
  rootClassName: null,
  className: null,
  plainClassName: null,
  initialValues: null,
  keepDirtyOnReinitialize: false,
  labelSelection: null,
  labelSelectionSeparator: null,
};

FilterPlainComponent.propTypes = {
  rootClassName: string,
  className: string,
  plainClassName: string,
  id: string.isRequired,
  onSearch: func,
  onSubmit: func.isRequired,
  label: node.isRequired,
  labelSelection: node,
  labelSelectionSeparator: node,
  isSelected: bool.isRequired,
  children: node.isRequired,
  initialValues: object,
  keepDirtyOnReinitialize: bool,
  showSearch: bool,

  // form injectIntl
  intl: intlShape.isRequired,
};

const FilterPlain = injectIntl(FilterPlainComponent);

export default FilterPlain;
