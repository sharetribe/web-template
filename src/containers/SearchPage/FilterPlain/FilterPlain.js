import React, { Component } from 'react';
import classNames from 'classnames';

import { FormattedMessage, injectIntl, intlShape } from '../../../util/reactIntl';

import IconPlus from '../IconPlus/IconPlus';
import FilterForm from '../FilterForm/FilterForm';

import css from './FilterPlain.module.css';

/**
 * FilterPlain component
 * TODO: change to functional component
 *
 * @component
 * @param {Object} props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {string} [props.plainClassName] - Custom class that extends the default class css.plain
 * @param {string} props.id - The ID
 * @param {Function} props.onSubmit - The function to submit
 * @param {React.Node} props.label - The label
 * @param {React.Node} [props.labelSelection] - The label with active selection
 * @param {React.Node} [props.labelSelectionSeparator] - The label selection separator
 * @param {boolean} props.isSelected - Whether the filter is selected
 * @param {React.Node} props.children - The children
 * @param {Object} [props.initialValues] - The initial values
 * @param {boolean} [props.keepDirtyOnReinitialize] - Whether to keep dirty on reinitialize
 * @param {intlShape} props.intl - The intl object
 * @returns {JSX.Element}
 */
class FilterPlainComponent extends Component {
  constructor(props) {
    super(props);
    this.state = { isOpen: true };

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
      label,
      labelSelection,
      labelSelectionSeparator,
      isSelected,
      children,
      initialValues,
      keepDirtyOnReinitialize = false,
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

const FilterPlain = injectIntl(FilterPlainComponent);

export default FilterPlain;
