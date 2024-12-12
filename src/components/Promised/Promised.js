/* eslint-disable no-underscore-dangle */
import { Component } from 'react';

/**
 * Promised component makes it easier to render content that
 * depends on resolution of a Promise.
 *
 * @example
 * <Promised promise={givenPromise} renderFulfilled={v => <b>{v}</b>} renderRejected={v => <b>v</b>} />
 *
 * @component
 * @param {Object} props
 * @param {Promise} props.promise - The promise to resolve
 * @param {Function} props.renderFulfilled - The function to render when the promise is fulfilled
 * @param {Function} props.renderRejected - The function to render when the promise is rejected
 * @returns {JSX.Element}
 */
class Promised extends Component {
  constructor(props) {
    super(props);

    // success value is string to be more useful when rendering texts.
    this.state = {
      value: '',
      error: null,
    };
    this._isMounted = false;
  }

  componentDidMount() {
    this._isMounted = true;
    this.props.promise
      .then(value => {
        if (this._isMounted) {
          this.setState({ value });
        }
      })
      .catch(error => {
        if (this._isMounted) {
          this.setState({ error });
        }
      });
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  render() {
    const { renderFulfilled, renderRejected = e => e } = this.props;
    return this.state.error ? renderRejected(this.state.error) : renderFulfilled(this.state.value);
  }
}

export default Promised;
