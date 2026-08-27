import React, { Component } from 'react';

import appSettings from '../../config/settings';

import { LoadableComponentErrorBoundaryPage } from './LoadableComponentErrorBoundaryPage';

const CHUNK_LOAD_RELOAD_KEY = 'LoadableComponentErrorBoundary.reloaded';

const tryGetChunkLoadReloadFlag = () => {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return null;
    }
    return window.sessionStorage.getItem(CHUNK_LOAD_RELOAD_KEY) === 'true';
  } catch (e) {
    return null;
  }
};

const trySetChunkLoadReloadFlag = () => {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return false;
    }
    window.sessionStorage.setItem(CHUNK_LOAD_RELOAD_KEY, 'true');
    return true;
  } catch (e) {
    return false;
  }
};

const tryClearChunkLoadReloadFlag = () => {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.removeItem(CHUNK_LOAD_RELOAD_KEY);
    }
  } catch (e) {
    // Ignore unavailable sessionStorage (e.g. private mode restrictions).
  }
};

// Use ErrorBoyndary to catch ChunkLoadError
// https://reactjs.org/docs/error-boundaries.html
class LoadableComponentErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { error };
  }

  componentDidCatch(error) {
    // After a deploy, long-lived tabs can request removed chunk files.
    // Reload once so the browser picks up the new HTML/chunk map.
    if (error?.name !== 'ChunkLoadError' || typeof window === 'undefined') {
      return;
    }

    const hasReloaded = tryGetChunkLoadReloadFlag();
    if (hasReloaded === true) {
      return;
    }

    // Only reload when we can persist the guard; otherwise the error page is shown.
    if (hasReloaded === false && trySetChunkLoadReloadFlag()) {
      window.location.reload();
    }
  }

  componentDidMount() {
    this.clearReloadFlagWhenHealthy();
  }

  componentDidUpdate() {
    this.clearReloadFlagWhenHealthy();
  }

  clearReloadFlagWhenHealthy() {
    // Successful render means current chunks work; allow a future deploy to reload once again.
    if (!this.state.error) {
      tryClearChunkLoadReloadFlag();
    }
  }

  render() {
    if (this.state.error && this.state.error.name === 'ChunkLoadError') {
      return <LoadableComponentErrorBoundaryPage />;
    }

    return this.props.children;
  }
}

// LoadableComponentErrorBoundary helps in situations
// where production build changes in the server and
// long-living client app tries to fetch code chunks that don't exist anymore.
// Note: in development mode with Hot Module Reloading (HMR) in use, this causes error loops.
const UseLoadableErrorBoundaryOnlyInProdutionMode = props => {
  const { children } = props;
  return appSettings.dev ? (
    children
  ) : (
    <LoadableComponentErrorBoundary>{children}</LoadableComponentErrorBoundary>
  );
};
export default UseLoadableErrorBoundaryOnlyInProdutionMode;
