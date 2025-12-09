import React, { Component } from 'react';
import classNames from 'classnames';

import { injectIntl, intlShape } from '../../../util/reactIntl';

import { OutsideClickHandler } from '../../../components';

import KeyboardListener from '../KeyboardListener/KeyboardListener';
import PopupOpenerButton from '../PopupOpenerButton/PopupOpenerButton';
import FilterForm from '../FilterForm/FilterForm';

import css from './FilterPopup.module.css';

const FOCUSABLE_ELEMENTS = 'button, [tabindex], input, select, textarea';

const moveFocusToFirstFocusableElement = formId => {
  if (formId.indexOf('.dates.popup.form') > 0) {
    // NOTE: this is a special case for the Dates filter.
    // It would be better if the logic is moved to the DatePicker component.
    const currentDate = document.getElementById(formId)?.querySelector('[data-current="true"]');
    currentDate?.focus();
  } else {
    const form = document.getElementById(formId);
    const focusableElements = form.querySelectorAll(FOCUSABLE_ELEMENTS);
    if (focusableElements.length > 0) {
      const firstFocusableElement = Array.from(focusableElements).find(
        element => !(element.tabIndex < 0 || element.disabled)
      );
      firstFocusableElement?.focus();
    }
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
 * FilterPopup component
 *
 * @component
 * @param {Object} props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {string} [props.popupClassName] - Custom class that overrides the default class css.popupSize
 * @param {string} props.id - The ID
 * @param {React.Node} props.label - The label
 * @param {number} [props.labelMaxWidth] - The maximum width of the label
 * @param {boolean} props.isSelected - Whether the filter is selected
 * @param {React.Node} props.children - The children
 * @param {Object} [props.initialValues] - The initial values
 * @param {boolean} [props.keepDirtyOnReinitialize] - Whether to keep dirty on reinitialize
 * @param {number} [props.contentPlacementOffset] - The content placement offset
 * @param {Function} props.onSubmit - The function to submit
 * @param {intlShape} props.intl - The intl object
 * @returns {JSX.Element}
 */
class FilterPopup extends Component {
  constructor(props) {
    super(props);

    this.state = { isOpen: false };
    this.filter = null;
    this.filterContent = null;

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleClear = this.handleClear.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.toggleIsOpen = this.toggleIsOpen.bind(this);
    this.positionStyleForContent = this.positionStyleForContent.bind(this);
  }

  handleSubmit(values) {
    const { id, onSubmit } = this.props;
    this.setState({ isOpen: false });
    const button = document.getElementById(`${id}.toggle`);
    if (button) {
      button.focus();
    }

    onSubmit(values);
  }

  handleClear() {
    const { id, onSubmit, onClear } = this.props;
    this.setState({ isOpen: false });

    const button = document.getElementById(`${id}.toggle`);
    if (button) {
      button.focus();
    }

    if (onClear) {
      onClear();
    }

    onSubmit(null);
  }

  handleCancel() {
    const { id, onSubmit, onCancel, initialValues } = this.props;
    this.setState({ isOpen: false });

    const button = document.getElementById(`${id}.toggle`);
    if (button) {
      button.focus();
    }

    if (onCancel) {
      onCancel();
    }

    onSubmit(initialValues);
  }

  handleBlur() {
    this.setState({ isOpen: false });
  }

  handleKeyDown(e) {
    // Gather all escape presses to close menu
    if (e.key === 'Escape') {
      this.toggleIsOpen({ enforcedState: false });
    }
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

  positionStyleForContent() {
    if (this.filter && this.filterContent) {
      // Render the filter content to the right from the menu
      // unless there's no space in which case it is rendered
      // to the left
      const distanceToRight = window.innerWidth - this.filter.getBoundingClientRect().right;
      const labelWidth = this.filter.offsetWidth;
      const contentWidth = this.filterContent.offsetWidth;
      const contentWidthBiggerThanLabel = contentWidth - labelWidth;
      const renderToRight = distanceToRight > contentWidthBiggerThanLabel;
      const contentPlacementOffset = this.props.contentPlacementOffset || 0;

      const offset = renderToRight
        ? { left: contentPlacementOffset }
        : { right: contentPlacementOffset };
      // set a min-width if the content is narrower than the label
      const minWidth = contentWidth < labelWidth ? { minWidth: labelWidth } : null;

      return { ...offset, ...minWidth };
    }
    return {};
  }

  render() {
    const {
      rootClassName,
      className,
      popupClassName,
      id,
      label,
      labelMaxWidth,
      isSelected,
      children,
      initialValues,
      keepDirtyOnReinitialize = false,
      contentPlacementOffset = 0,
      ariaLabel,
      containerId, // Note: this could be used to identify different filter containers
    } = this.props;

    const classes = classNames(rootClassName || css.root, className);
    const popupClasses = classNames(css.popup, { [css.isOpen]: this.state.isOpen });
    const popupSizeClasses = popupClassName || css.popupSize;
    const contentStyle = this.positionStyleForContent();
    const formId = `${id}.form`;
    const delayedMoveFocus = (formId, isMenuOpen, moveFocusFn) => {
      if (isMenuOpen) {
        setTimeout(() => {
          moveFocusFn(formId);
        }, 100);
      }
    };

    return (
      <OutsideClickHandler onOutsideClick={this.handleBlur}>
        <KeyboardListener
          className={classes}
          containerId={containerId}
          keyMap={{
            Enter: {
              action: 'toggle',
              callback: (...args) => {
                const [event, containerId, action] = args;
                if (event.target.id === `${id}.toggle`) {
                  event.preventDefault();
                  event.stopPropagation();
                  const isOpen = this.state.isOpen;
                  this.toggleIsOpen({
                    callback: () => {
                      delayedMoveFocus(formId, !isOpen, moveFocusToFirstFocusableElement);
                    },
                  });
                }
              },
            },
            ArrowDown: {
              action: 'down',
              callback: (...args) => {
                const [event, containerId, action] = args;
                if (!this.state.isOpen && event.target.id === `${id}.toggle`) {
                  event.preventDefault();
                  event.stopPropagation();
                  this.toggleIsOpen({
                    callback: () => {
                      delayedMoveFocus(formId, true, moveFocusToFirstFocusableElement);
                    },
                    enforcedState: true,
                  });
                } else if (this.filterContent.contains(event.target)) {
                  event.preventDefault();
                  event.stopPropagation();
                  moveFocusToNextFocusableElement(formId, 'next');
                }
              },
            },
            ArrowUp: {
              action: 'up',
              callback: (...args) => {
                const [event, containerId, action] = args;
                if (this.state.isOpen && event.target.id === `${id}.toggle`) {
                  event.preventDefault();
                  event.stopPropagation();
                  const button = document.getElementById(`${id}.toggle`);
                  if (button) {
                    button.focus();
                  }

                  this.toggleIsOpen({ enforcedState: false });
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
                    callback: () => {
                      delayedMoveFocus(formId, true, moveFocusToFirstFocusableElement);
                    },
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
                    callback: () => {
                      delayedMoveFocus(formId, true, moveFocusToLastFocusableElement);
                    },
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
          <div
            ref={node => {
              this.filter = node;
            }}
          >
            <PopupOpenerButton
              id={`${id}.toggle`}
              isSelected={isSelected}
              labelMaxWidth={labelMaxWidth}
              toggleOpen={() => this.toggleIsOpen()}
              aria-label={ariaLabel}
              aria-expanded={this.state.isOpen}
              aria-controls={this.state.isOpen ? formId : ''}
            >
              {label}
            </PopupOpenerButton>
            <div
              id={id}
              className={popupClasses}
              ref={node => {
                this.filterContent = node;
              }}
              style={contentStyle}
            >
              {this.state.isOpen ? (
                <FilterForm
                  id={formId}
                  paddingClasses={popupSizeClasses}
                  showAsPopup
                  contentPlacementOffset={contentPlacementOffset}
                  initialValues={initialValues}
                  keepDirtyOnReinitialize={keepDirtyOnReinitialize}
                  onSubmit={this.handleSubmit}
                  onCancel={this.handleCancel}
                  onClear={this.handleClear}
                >
                  {children}
                </FilterForm>
              ) : null}
            </div>
          </div>
        </KeyboardListener>
      </OutsideClickHandler>
    );
  }
}

export default injectIntl(FilterPopup);
