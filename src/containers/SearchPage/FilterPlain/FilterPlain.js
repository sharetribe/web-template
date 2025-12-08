import React, { Component } from 'react';
import classNames from 'classnames';

import { FormattedMessage, injectIntl, intlShape } from '../../../util/reactIntl';

import IconPlus from '../IconPlus/IconPlus';
import FilterForm from '../FilterForm/FilterForm';
import KeyboardListener from '../KeyboardListener/KeyboardListener';

import css from './FilterPlain.module.css';

const FOCUSABLE_ELEMENTS = 'button, [tabindex], input, select, textarea';

const moveFocusToFirstFocusableElement = formId => {
  const form = document.getElementById(formId);
  const focusableElements = form.querySelectorAll(FOCUSABLE_ELEMENTS);
  if (focusableElements.length > 0) {
    const firstFocusableElement = Array.from(focusableElements).find(
      element => !(element.tabIndex < 0 || element.disabled)
    );
    firstFocusableElement?.focus();
  }
};
const moveFocusToLastFocusableElement = formId => {
  const form = document.getElementById(formId);
  const focusableElements = form.querySelectorAll(FOCUSABLE_ELEMENTS);
  if (focusableElements.length > 0) {
    const lastFocusableElement = Array.from(focusableElements)
      .reverse()
      .find(element => !(element.tabIndex < 0 || element.disabled));
    lastFocusableElement?.focus();
  }
};

const moveFocusToNextFocusableElement = (formId, direction = 'next') => {
  const form = document.getElementById(formId);
  const focusableElements = form.querySelectorAll(FOCUSABLE_ELEMENTS);
  if (focusableElements.length > 0) {
    const currentIndex = Array.from(focusableElements).findIndex(
      element => element === document.activeElement
    );
    const targetIndex =
      direction === 'next' && currentIndex < focusableElements.length - 1
        ? currentIndex + 1
        : direction === 'next'
        ? 0
        : direction === 'previous' && currentIndex > 0
        ? currentIndex - 1
        : focusableElements.length - 1;
    focusableElements[targetIndex]?.focus();
  }
};

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
    window.__focusedElementId__ = null;
  }

  handleClear() {
    const { id, onSubmit, onClear } = this.props;

    // Due to async API call, focused element is not guaranteed to be the clear button.
    window.__focusedElementId__ = `${id}.form.clear`;

    if (onClear) {
      onClear();
    }

    onSubmit(null);
  }

  toggleIsOpen(options = {}) {
    const { callback, enforcedState } = options || {};
    const cb = callback || (() => {});
    if (enforcedState !== undefined) {
      this.setState({ isOpen: enforcedState }, cb);
    } else {
      this.setState(prevState => {
        return { isOpen: !prevState.isOpen };
      }, cb);
    }
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
      ariaLabel,
      containerId, //TODO
    } = this.props;
    const formId = `${id}.form`;
    const classes = classNames(rootClassName || css.root, className);
    const inertMaybe = this.state.isOpen ? {} : { inert: '' };

    return (
      <KeyboardListener
        className={classes}
        containerId={containerId}
        keyMap={{
          Enter: {
            action: 'toggle',
            callback: (...args) => {
              const [event, containerId, action] = args;
              if (event.target.id === `${id}.toggle`) {
                const isOpen = this.state.isOpen;
                event.preventDefault();
                event.stopPropagation();
                this.toggleIsOpen({
                  callback: () => {
                    if (!isOpen) {
                      moveFocusToFirstFocusableElement(formId);
                    }
                  },
                });
              }
            },
          },
          ArrowDown: {
            action: 'down',
            callback: (...args) => {
              const [event, containerId, action] = args;
              if (event.target.id === `${id}.toggle`) {
                event.preventDefault();
                event.stopPropagation();
                if (!this.state.isOpen) {
                  this.toggleIsOpen({
                    callback: () => moveFocusToFirstFocusableElement(formId),
                    enforcedState: true,
                  });
                }
              } else if (this.filterContent.contains(event.target)) {
                event.preventDefault();
                event.stopPropagation();
                moveFocusToNextFocusableElement(formId, 'next');
              }
            },
          },
          ArrowUp: {
            action: 'close',
            callback: (...args) => {
              const [event, containerId, action] = args;
              if (event.target.id === `${id}.toggle`) {
                event.preventDefault();
                event.stopPropagation();
                if (this.state.isOpen) {
                  this.toggleIsOpen({ enforcedState: false });
                }
              } else if (this.filterContent.contains(event.target)) {
                event.preventDefault();
                event.stopPropagation();
                moveFocusToNextFocusableElement(formId, 'previous');
              }
            },
          },
          Home: {
            action: 'first',
            callback: (...args) => {
              const [event, containerId, action] = args;
              if (!this.state.isOpen && event.target.id === `${id}.toggle`) {
                event.preventDefault();
                event.stopPropagation();
                this.toggleIsOpen({
                  callback: () => moveFocusToFirstFocusableElement(formId),
                  enforcedState: true,
                });
              }
            },
          },
          End: {
            action: 'last',
            callback: (...args) => {
              const [event, containerId, action] = args;
              if (!this.state.isOpen && event.target.id === `${id}.toggle`) {
                event.preventDefault();
                event.stopPropagation();
                this.toggleIsOpen({
                  callback: () => moveFocusToLastFocusableElement(formId),
                  enforcedState: true,
                });
              }
            },
          },
          Escape: {
            action: 'close',
            callback: (...args) => {
              const [event, containerId, action] = args;
              if (this.state.isOpen) {
                event.preventDefault();
                event.stopPropagation();
                const button = document.getElementById(`${id}.toggle`);
                if (button) {
                  button.focus();
                }
                this.toggleIsOpen({ enforcedState: false });
              }
            },
          },
        }}
      >
        <div className={css.filterHeader}>
          <button
            id={`${id}.toggle`}
            className={css.labelButton}
            onClick={() => this.toggleIsOpen()}
            aria-label={ariaLabel}
            aria-expanded={this.state.isOpen}
            aria-controls={this.state.isOpen ? formId : ''}
          >
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
          {...inertMaybe}
        >
          <FilterForm
            id={formId}
            liveEdit
            onChange={this.handleChange}
            initialValues={initialValues}
            keepDirtyOnReinitialize={keepDirtyOnReinitialize}
            clearButton={
              <button
                id={`${formId}.clear`}
                type="button"
                className={css.clearButton}
                onClick={this.handleClear}
              >
                <FormattedMessage id={'FilterPlain.clear'} />
              </button>
            }
          >
            {children}
          </FilterForm>
        </div>
      </KeyboardListener>
    );
  }
}

const FilterPlain = injectIntl(FilterPlainComponent);

export default FilterPlain;
