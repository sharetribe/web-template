// src/stripe.js
import { loadStripe } from '@stripe/stripe-js';

const pk =
  process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY ||
  process.env.STRIPE_PUBLISHABLE_KEY ||
  '';

if (!pk) {
  // Masked warning so we can compare LIVE vs TEST from prod console
  console.warn('[StripeInit] Missing publishable key in client build (LIVE?).');
}

// If key missing, never throw—resolve null so UI can render a fallback
export const stripePromise = pk ? loadStripe(pk) : Promise.resolve(null);

// Small build-time probe to confirm what got inlined in the LIVE bundle
// Shows first/last 4 chars only.
const masked =
  pk && pk.length >= 10 ? `${pk.slice(0,4)}…${pk.slice(-4)}` : (pk ? 'set(short)' : 'unset');
window.__BUILD_DIAG__ = {
  ...(window.__BUILD_DIAG__ || {}),
  stripePkMasked: masked,
};
