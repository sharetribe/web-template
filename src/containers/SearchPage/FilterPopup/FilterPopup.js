import React, { Component } from 'react';
import classNames from 'classnames';

import { injectIntl, intlShape } from '../../../util/reactIntl';

import { OutsideClickHandler } from '../../../components';

import PopupOpenerButton from '../PopupOpenerButton/PopupOpenerButton';
import FilterForm from '../FilterForm/FilterForm';

import css from './FilterPopup.module.css';

const KEY_CODE_ESCAPE = 27;

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
    this.toggleOpen = this.toggleOpen.bind(this);
    this.positionStyleForContent = this.positionStyleForContent.bind(this);
  }

  handleSubmit(values) {
    const { onSubmit } = this.props;
    this.setState({ isOpen: false });
    onSubmit(values);
  }

  handleClear() {
    const { onSubmit, onClear } = this.props;
    this.setState({ isOpen: false });

    if (onClear) {
      onClear();
    }

    onSubmit(null);
  }

  handleCancel() {
    const { onSubmit, onCancel, initialValues } = this.props;
    this.setState({ isOpen: false });

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
    if (e.keyCode === KEY_CODE_ESCAPE) {
      this.toggleOpen(false);
    }
  }

  toggleOpen(enforcedState) {
    if (enforcedState) {
      this.setState({ isOpen: enforcedState });
    } else {
      this.setState(prevState => ({ isOpen: !prevState.isOpen }));
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
    } = this.props;

    const classes = classNames(rootClassName || css.root, className);
    const popupClasses = classNames(css.popup, { [css.isOpen]: this.state.isOpen });
    const popupSizeClasses = popupClassName || css.popupSize;
    const contentStyle = this.positionStyleForContent();

    return (
      <OutsideClickHandler onOutsideClick={this.handleBlur}>
        <div
          className={classes}
          onKeyDown={this.handleKeyDown}
          ref={node => {
            this.filter = node;
          }}
        >
          <PopupOpenerButton
            isSelected={isSelected}
            labelMaxWidth={labelMaxWidth}
            toggleOpen={this.toggleOpen}
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
                id={`${id}.form`}
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
      </OutsideClickHandler>
    );
  }
}

export default injectIntl(FilterPopup);
