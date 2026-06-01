import { isBenignResizeObserverError, setup } from './log';

describe('isBenignResizeObserverError', () => {
  it('matches the legacy "loop limit exceeded" wording', () => {
    expect(isBenignResizeObserverError('ResizeObserver loop limit exceeded')).toBe(true);
  });

  it('matches the current "undelivered notifications" wording', () => {
    expect(
      isBenignResizeObserverError('ResizeObserver loop completed with undelivered notifications')
    ).toBe(true);
  });

  it('matches when the benign message is embedded in a larger string', () => {
    expect(
      isBenignResizeObserverError(
        'Uncaught Error: ResizeObserver loop completed with undelivered notifications'
      )
    ).toBe(true);
  });

  it('does not match unrelated errors', () => {
    expect(isBenignResizeObserverError('TypeError: x is not a function')).toBe(false);
    expect(isBenignResizeObserverError('ResizeObserver is not defined')).toBe(false);
  });

  it('returns false for non-string input', () => {
    expect(isBenignResizeObserverError(undefined)).toBe(false);
    expect(isBenignResizeObserverError(null)).toBe(false);
    expect(isBenignResizeObserverError({ message: 'whatever' })).toBe(false);
  });
});

describe('setup() benign ResizeObserver suppression', () => {
  // Dispatches a synthetic window 'error' event and reports whether it
  // reached a downstream window-level handler (i.e. was NOT suppressed).
  const dispatchWindowError = message => {
    let reachedDownstreamHandler = false;
    const downstreamHandler = () => {
      reachedDownstreamHandler = true;
    };
    // Registered without capture, so the capture-phase suppressor runs first.
    window.addEventListener('error', downstreamHandler);

    const event = new Event('error', { cancelable: true });
    // ErrorEvent#message is read-only; assign on the plain Event instead.
    Object.defineProperty(event, 'message', { value: message, configurable: true });
    window.dispatchEvent(event);

    window.removeEventListener('error', downstreamHandler);
    return reachedDownstreamHandler;
  };

  beforeAll(() => {
    setup();
  });

  it('stops the benign ResizeObserver error from reaching downstream handlers', () => {
    expect(
      dispatchWindowError('ResizeObserver loop completed with undelivered notifications')
    ).toBe(false);
  });

  it('lets unrelated errors propagate to downstream handlers', () => {
    expect(dispatchWindowError('TypeError: something genuinely broke')).toBe(true);
  });
});
