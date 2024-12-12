import React, { Component } from 'react';
import classNames from 'classnames';

import css from './OutsideClickHandler.module.css';

/**
 * A component that handles outside clicks.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {Function} props.onOutsideClick - The function to handle the outside click
 * @param {ReactNode} props.children - The children to render
 * @returns {JSX.Element}
 */
export default class OutsideClickHandler extends Component {
  constructor(props) {
    super(props);

    this.handleClick = this.handleClick.bind(this);
  }

  componentDidMount() {
    document.addEventListener('mousedown', this.handleClick, false);
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClick, false);
  }

  handleClick(event) {
    if (!this.node.contains(event.target)) {
      this.props.onOutsideClick();
    }
  }

  render() {
    const { rootClassName, className, children } = this.props;
    const classes = classNames(rootClassName || css.root, className);

    return (
      <div className={classes} ref={node => (this.node = node)}>
        {children}
      </div>
    );
  }
}
