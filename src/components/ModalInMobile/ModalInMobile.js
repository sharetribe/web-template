import React, { Component } from 'react';
import classNames from 'classnames';
import { Modal } from '../../components';
import { withViewport } from '../../util/uiHelpers';

import css from './ModalInMobile.module.css';

/**
 * ModalInMobile gives possibility separate part of existing DOM so that in mobile views that
 * fragment is shown in a separate modal layer on top of the page.
 *
 * Currently, this does not implement resize listener for window.
 *
 * @example
 * <Parent>
 *   <ModalInMobile isModalOpenOnMobile={this.state.modalOpen} onClose={handleClose}>
 *     <FormX />
 *   </ModalInMobile>
 * </Parent>
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to component's own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {string?} props.containerClassName overwrite components own css.modalContainer
 * @param {string} props.id
 * @param {boolean?} props.isModalOpenOnMobile
 * @param {Function} props.onClose
 * @param {Function} props.onManageDisableScrolling
 * @param {number?} props.showAsModalMaxWidth
 * @param {ReactNode?} props.closeButtonMessage
 * @param {Object} props.viewport
 * @param {number} props.viewport.width
 * @param {number} props.viewport.height
 * @returns {JSX.Element} container which is shown as a modal on mobile layout
 */
class ModalInMobileComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
    };
    this.handleClose = this.handleClose.bind(this);
    this.changeOpenStatus = this.changeOpenStatus.bind(this);
  }

  componentDidMount() {
    const { isModalOpenOnMobile, showAsModalMaxWidth, viewport } = this.props;

    // After Mounting, component can adapt to responsive screen size
    const isMobileLayout = viewport.width <= showAsModalMaxWidth;

    if (isMobileLayout && isModalOpenOnMobile) {
      this.changeOpenStatus(isModalOpenOnMobile);
    }
  }

  componentDidUpdate() {
    const { isModalOpenOnMobile, showAsModalMaxWidth, viewport } = this.props;

    const isChanging = isModalOpenOnMobile !== this.state.isOpen;
    const isMobileLayout = viewport.width <= showAsModalMaxWidth;
    const shouldBeClosedAsModal = !isMobileLayout && !isModalOpenOnMobile;

    // Handle change if status is changing on mobile layout or it is closing (on desktop layout)
    if (isChanging && (isMobileLayout || shouldBeClosedAsModal)) {
      this.changeOpenStatus(isModalOpenOnMobile);
    }
  }

  changeOpenStatus(isOpen) {
    this.setState({ isOpen });
  }

  handleClose(event) {
    const { onClose } = this.props;
    this.changeOpenStatus(false);
    if (onClose) {
      onClose(event);
    }
  }

  render() {
    const {
      children,
      className,
      rootClassName,
      containerClassName,
      id,
      showAsModalMaxWidth = 0,
      closeButtonMessage,
      onManageDisableScrolling,
      viewport,
      usePortal,
    } = this.props;

    const isMobileLayout = viewport.width <= showAsModalMaxWidth;
    const isOpenInMobile = this.state.isOpen;
    const isClosedInMobile = isMobileLayout && !isOpenInMobile;
    const isOpen = isOpenInMobile && isMobileLayout;

    // We have 3 view states:
    // - default desktop layout (just an extra wrapper)
    // - mobile layout: content visible inside modal popup
    // - mobile layout: content hidden
    const closedClassName = isClosedInMobile ? css.modalHidden : null;
    const classes = classNames(rootClassName || css.root, className);

    return (
      <Modal
        className={classes}
        containerClassName={containerClassName || css.modalContainer}
        contentClassName={css.modalContent}
        id={id}
        isOpen={isOpen}
        isClosedClassName={closedClassName}
        onClose={this.handleClose}
        closeButtonMessage={closeButtonMessage}
        onManageDisableScrolling={onManageDisableScrolling}
        usePortal={usePortal && isOpen}
      >
        {children}
      </Modal>
    );
  }
}

const ModalInMobile = withViewport(ModalInMobileComponent);

export default ModalInMobile;
