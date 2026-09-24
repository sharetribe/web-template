/**
 * Thin re-export of the Sentry browser APIs this app uses.
 * Kept as static named imports so webpack can tree-shake unused SDK features
 * (Replay, Feedback, tracing, etc.) out of the async sentry chunk.
 */
export { init, setUser, withScope, captureException } from '@sentry/browser';
