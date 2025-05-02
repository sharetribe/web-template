/**
 * A higher order component (HOC) that lazy loads the current element and provides
 * dimensions to the wrapped component as a `dimensions` prop that has
 * the shape `{ width: 600, height: 400}`.
 *
 * @param {React.Component} Component to be wrapped by this HOC
 * @param {Object} options pass in options like maxWidth and maxHeight. To load component after
 * initial rendering has passed or after user has interacted with the window (e.g. scrolled),
 * use`loadAfterInitialRendering: 1500` (value should be milliseconds).
 *
 * @return {Object} HOC component which knows its dimensions
 */
import React, { Component as ReactComponent, useEffect, useRef, useState } from 'react';
import throttle from 'lodash/throttle';

/**
 * A higher order component (HOC) that provides the current viewport
 * dimensions to the wrapped component as a `viewport` prop that has
 * the shape `{ width: 600, height: 400}`.
 */
export const withViewport = Component => {
  // The resize event is flooded when the browser is resized. We'll
  // use a small timeout to throttle changing the viewport since it
  // will trigger rerendering.
  const WAIT_MS = 100;

  class WithViewportComponent extends ReactComponent {
    constructor(props) {
      super(props);
      this.state = { width: 0, height: 0 };
      this.handleWindowResize = this.handleWindowResize.bind(this);
      this.setViewport = throttle(this.setViewport.bind(this), WAIT_MS);
    }

    componentDidMount() {
      this.setViewport();
      window.addEventListener('resize', this.handleWindowResize);
      window.addEventListener('orientationchange', this.handleWindowResize);
    }

    componentWillUnmount() {
      window.removeEventListener('resize', this.handleWindowResize);
      window.removeEventListener('orientationchange', this.handleWindowResize);
    }

    handleWindowResize() {
      this.setViewport();
    }

    setViewport() {
      this.setState({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    render() {
      const viewport = this.state;
      const props = { ...this.props, viewport };
      return <Component {...props} />;
    }
  }

  WithViewportComponent.displayName = `withViewport(${Component.displayName || Component.name})`;

  return WithViewportComponent;
};

/**
 * A higher order component (HOC) that provides dimensions to the wrapped component as a
 * `dimensions` prop that has the shape `{ width: 600, height: 400}`.
 *
 * @param {React.Component} Component to be wrapped by this HOC
 * @param {Object} options pass in options like maxWidth and maxHeight.
 *
 * @return {Object} HOC component which knows its dimensions
 */
export const withDimensions = (Component, options = {}) => {
  // The resize event is flooded when the browser is resized. We'll
  // use a small timeout to throttle changing the viewport since it
  // will trigger rerendering.
  const THROTTLE_WAIT_MS = 200;
  // First render default wait after mounting (small wait for styled paint)
  const RENDER_WAIT_MS = 100;

  class WithDimensionsComponent extends ReactComponent {
    constructor(props) {
      super(props);
      this.element = null;
      this.defaultRenderTimeout = null;

      this.state = { width: 0, height: 0 };

      this.handleWindowResize = throttle(this.handleWindowResize.bind(this), THROTTLE_WAIT_MS);
      this.setDimensions = this.setDimensions.bind(this);
    }

    componentDidMount() {
      window.addEventListener('resize', this.handleWindowResize);
      window.addEventListener('orientationchange', this.handleWindowResize);

      this.defaultRenderTimeout = window.setTimeout(() => {
        this.setDimensions();
      }, RENDER_WAIT_MS);
    }

    componentWillUnmount() {
      window.removeEventListener('resize', this.handleWindowResize);
      window.removeEventListener('orientationchange', this.handleWindowResize);
      window.clearTimeout(this.defaultRenderTimeout);
    }

    handleWindowResize() {
      window.requestAnimationFrame(() => {
        this.setDimensions();
      });
    }

    setDimensions() {
      this.setState(prevState => {
        const { clientWidth, clientHeight } = this.element || { clientWidth: 0, clientHeight: 0 };
        return { width: clientWidth, height: clientHeight };
      });
    }

    render() {
      // Dimensions from state (i.e. dimension after previous resize)
      // These are needed for component rerenders
      const { width, height } = this.state;

      // Current dimensions from element reference
      const { clientWidth, clientHeight } = this.element || { clientWidth: 0, clientHeight: 0 };
      const hasDimensions =
        (width !== 0 && height !== 0) || (clientWidth !== 0 && clientHeight !== 0);

      // clientWidth and clientHeight
      const currentDimensions =
        clientWidth !== 0 && clientHeight !== 0
          ? { width: clientWidth, height: clientHeight }
          : width !== 0 && height !== 0
          ? { width, height }
          : {};

      const props = { ...this.props, dimensions: currentDimensions };

      // lazyLoadWithDimensions HOC needs to take all given space
      // unless max dimensions are provided through options.
      const { maxWidth, maxHeight } = options;
      const maxWidthMaybe = maxWidth ? { maxWidth } : {};
      const maxHeightMaybe = maxHeight ? { maxHeight } : {};
      const style =
        maxWidth || maxHeight
          ? { width: '100%', height: '100%', ...maxWidthMaybe, ...maxHeightMaybe }
          : { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 };

      return (
        <div
          ref={element => {
            this.element = element;
          }}
          style={style}
        >
          {hasDimensions ? <Component {...props} /> : null}
        </div>
      );
    }
  }

  WithDimensionsComponent.displayName = `withDimensions(${Component.displayName ||
    Component.name})`;

  return WithDimensionsComponent;
};

/**
 * A higher order component (HOC) that lazy loads the current element and provides
 * dimensions to the wrapped component as a `dimensions` prop that has
 * the shape `{ width: 600, height: 400}`.
 *
 * @param {React.Component} Component to be wrapped by this HOC
 * @param {Object} options pass in options like maxWidth and maxHeight. To load component after
 * initial rendering has passed or after user has interacted with the window (e.g. scrolled),
 * use`loadAfterInitialRendering: 1500` (value should be milliseconds).
 *
 * @return {Object} HOC component which knows its dimensions
 */
export const lazyLoadWithDimensions = createLazyLoader({ withDimensions: true });

const THROTTLE_WAIT_MS = 200;
const RENDER_WAIT_MS = 100;
const NEAR_VIEWPORT_MARGIN = 50;

export function createLazyLoader({ withDimensions = false } = {}) {
  return function lazyLoad(Component, options = {}) {
    const HOC = props => {
      const containerRef = useRef(null);
      const [visible, setVisible] = useState(false);
      const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

      useEffect(() => {
        const checkVisibility = () => {
          if (!visible && isElementNearViewport(containerRef.current, NEAR_VIEWPORT_MARGIN)) {
            setVisible(true);
          }
        };

        const throttledCheck = throttle(checkVisibility, THROTTLE_WAIT_MS);

        const initialTimeout = setTimeout(() => {
          if (isElementNearViewport(containerRef.current, 0)) {
            setVisible(true);
          } else if (typeof options.loadAfterInitialRendering === 'number') {
            setTimeout(() => setVisible(true), options.loadAfterInitialRendering);
          }
        }, RENDER_WAIT_MS);

        window.addEventListener('scroll', throttledCheck);
        window.addEventListener('resize', throttledCheck);
        window.addEventListener('orientationchange', throttledCheck);

        return () => {
          clearTimeout(initialTimeout);
          window.removeEventListener('scroll', throttledCheck);
          window.removeEventListener('resize', throttledCheck);
          window.removeEventListener('orientationchange', throttledCheck);
        };
      }, [visible]);

      useEffect(() => {
        if (visible && withDimensions && containerRef.current) {
          const { clientWidth, clientHeight } = containerRef.current;
          setDimensions({ width: clientWidth, height: clientHeight });
        }
      }, [visible, withDimensions]);

      const style = withDimensions
        ? options.maxWidth || options.maxHeight
          ? {
              width: '100%',
              height: '100%',
              maxWidth: options.maxWidth,
              maxHeight: options.maxHeight,
            }
          : { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }
        : undefined;

      return (
        <div ref={containerRef} style={style}>
          {visible ? <Component {...props} {...(withDimensions ? { dimensions } : {})} /> : null}
        </div>
      );
    };

    HOC.displayName = `lazyLoad${
      withDimensions ? 'WithDimensions' : 'WhenVisible'
    }(${Component.displayName || Component.name})`;

    return HOC;
  };
}

function isElementNearViewport(element, margin = 0) {
  if (!element) return false;

  const rect = element.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

  return (
    (rect.top >= 0 && rect.top <= viewportHeight + margin) ||
    (rect.bottom >= -margin && rect.bottom <= viewportHeight)
  );
}
