/**
 * Modal creates popup which on mobile layout fills the entire visible page.
 *
 * Example:
 * <Parent>
 *   <Modal id="UniqueIdForThisModal" isOpen={this.state.modalIsOpen} onClose={handleClose}>
 *     <FormX />
 *   </Modal>
 * </Parent>
 */
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import { FormattedMessage, injectIntl } from '../../util/reactIntl';
import { Button, IconClose } from '../../components';

import css from './Modal.module.css';

const KEY_CODE_ESCAPE = 27;

class Portal extends React.Component {
  constructor(props) {
    super(props);
    this.el = document.createElement('div');
  }

  componentDidMount() {
    // The portal element is inserted in the DOM tree after
    // the Modal's children are mounted, meaning that children
    // will be mounted on a detached DOM node. If a child
    // component requires to be attached to the DOM tree
    // immediately when mounted, for example to measure a
    // DOM node, or uses 'autoFocus' in a descendant, add
    // state to Modal and only render the children when Modal
    // is inserted in the DOM tree.
    this.props.portalRoot.appendChild(this.el);
  }

  componentWillUnmount() {
    this.props.portalRoot.removeChild(this.el);
  }

  render() {
    return ReactDOM.createPortal(this.props.children, this.el);
  }
}

/**
 * Modal
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.scrollLayerClassName overwrite components own css.scrollLayer
 * @param {string?} props.containerClassName overwrite components own css.container
 * @param {string?} props.contentClassName overwrite components own css.content
 * @param {string?} props.isClosedClassName overwrite components own css.isClosed
 * @param {ReactNode} props.closeButtonMessage
 * @param {Object} props.lightCloseButton use lighter close button styles
 * @param {string} props.id
 * @param {Object} props.intl
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {Function} props.onManageDisableScrolling
 * @param {boolean} props.usePortal
 * @returns {JSX.Element} Modal element
 */
export class ModalComponent extends Component {
  constructor(props) {
    super(props);
    this.handleBodyKeyUp = this.handleBodyKeyUp.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleResize = this.handleResize.bind(this);

    this.refDiv = React.createRef();
    this.vh = null;

    this.state = {
      portalRoot: null,
    };
  }

  componentDidMount() {
    const { id, isOpen, onManageDisableScrolling } = this.props;
    onManageDisableScrolling(id, isOpen);
    window.document.body.addEventListener('keyup', this.handleBodyKeyUp);

    // A hack to update container height for mobile Safari,
    // when resizing happens due to scroll.
    // css.isOpenInPortal has "height: calc(var(--vh, 1vh) * 100)"
    this.vh = window.innerHeight * 0.01;
    window.document.documentElement.style.setProperty('--vh', `${this.vh}px`);
    window.addEventListener('resize', this.handleResize);

    this.setState({
      portalRoot: document.getElementById('portal-root'),
    });
  }

  componentDidUpdate(prevProps) {
    const { id, isOpen, onManageDisableScrolling } = prevProps;
    if (this.props.isOpen !== isOpen) {
      onManageDisableScrolling(id, this.props.isOpen);

      // Because we are using portal,
      // we need to set the focus inside Modal manually
      if (this.props.usePortal && this.props.isOpen) {
        this.refDiv.current.focus();
      }
    }
  }

  componentWillUnmount() {
    const { id, onManageDisableScrolling } = this.props;
    window.document.body.removeEventListener('keyup', this.handleBodyKeyUp);
    window.document.body.removeEventListener('resize', this.handleResize);
    onManageDisableScrolling(id, false);
  }

  handleBodyKeyUp(event) {
    const { isOpen } = this.props;
    if (event.keyCode === KEY_CODE_ESCAPE && isOpen) {
      this.handleClose(event);
    }
  }

  handleClose(event) {
    const { id, onClose, onManageDisableScrolling } = this.props;
    onManageDisableScrolling(id, false);
    onClose(event);
  }

  handleResize() {
    this.vh = window.innerHeight * 0.01;
    window.document.documentElement.style.setProperty('--vh', `${this.vh}px`);
  }

  render() {
    const {
      children,
      className,
      scrollLayerClassName,
      closeButtonMessage,
      containerClassName,
      contentClassName,
      lightCloseButton,
      intl,
      isClosedClassName = css.isClosed,
      isOpen,
      usePortal,
    } = this.props;

    const closeModalMessage = intl.formatMessage({ id: 'Modal.closeModal' });
    const closeMessage = closeButtonMessage || intl.formatMessage({ id: 'Modal.close' });
    const closeButtonClasses = classNames(css.close, {
      [css.closeLight]: lightCloseButton,
    });
    const closeBtn = isOpen ? (
      <nav className={css.marketplaceModalCloseNav} aria-label={closeModalMessage}>
        <Button
          onClick={this.handleClose}
          rootClassName={closeButtonClasses}
          title={closeModalMessage}
          aria-expanded={isOpen}
        >
          <span className={css.closeText}>{closeMessage}</span>
          <IconClose rootClassName={css.closeIcon} ariaLabel={closeMessage} />
        </Button>
      </nav>
    ) : null;

    // Modal uses given styles to wrap child components.
    // If props doesn't contain isClosedClassName, styles default to css.isClosed
    // This makes it possible to create ModalInMobile on top of Modal where style modes are:
    // visible, hidden, or none (ModalInMobile's children are always visible on desktop layout.)
    const isOpenClass = usePortal ? css.isOpenInPortal : css.isOpenInPlace;
    const modalClass = isOpen ? isOpenClass : isClosedClassName;
    const classes = classNames(modalClass, className);
    const scrollLayerClasses = scrollLayerClassName || css.scrollLayer;
    const containerClasses = containerClassName || css.container;
    const portalRoot = this.state.portalRoot;

    // If you want to use Portal https://reactjs.org/docs/portals.html
    // you need to use 'userPortal' flag.
    // ModalInMobile component needs to use the old Modal without the portal
    // because it's relying that the content is rendered inside
    // the DOM hierarchy of the parent component unlike Modal inside Portal.

    return !usePortal ? (
      <div className={classes}>
        <div className={scrollLayerClasses}>
          <div className={containerClasses}>
            {closeBtn}
            <div className={classNames(contentClassName || css.content)}>{children}</div>
          </div>
        </div>
      </div>
    ) : portalRoot ? (
      <Portal portalRoot={portalRoot}>
        <div className={classes}>
          <div className={scrollLayerClasses}>
            <div
              className={classNames(containerClasses, css.focusedDiv)}
              ref={this.refDiv}
              tabIndex="-1"
            >
              {closeBtn}
              <div className={classNames(contentClassName || css.content)}>{children}</div>
            </div>
          </div>
        </div>
      </Portal>
    ) : null;
  }
}

export default injectIntl(ModalComponent);
