import React from 'react';
import { Link } from 'react-router-dom';
import * as log from '../../util/log';
import styles from './ErrorBoundary.module.css';

export class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    log.error(error, 'ERROR_BOUNDARY_CAUGHT_ERROR', {
      errorInfo,
      isServer: typeof window === 'undefined',
      url: typeof window !== 'undefined' ? window.location.href : null
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.content || (
        <div className={styles.errorBoundary}>
          <img src="https://sharetribe-assets.imgix.net/66a1a311-8e1c-4025-b9bb-c53fe1063ee5/raw/0e/1bc4d8c7744d0e3c9f2d945ae8b51f0cfbeecc?auto=format&fit=clip&h=48&w=370&s=77349a8090d1feb3412951a919d0a0c4" />
          <h1>We're sorry, something went wrong.</h1>
          <p>Please return to the home page and try again, or contact support.</p>
          <a href="/">Home</a>
          <a href="mailto:support@skyfareracademy.com">support@skyfareracademy.com</a>
        </div>
      );
    }

    return this.props.children;
  }
}
