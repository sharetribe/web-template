// src/stripe.js
import { loadStripe } from '@stripe/stripe-js';

const pk =
  process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY ||
  process.env.STRIPE_PUBLISHABLE_KEY ||
  '';

const masked = pk && pk.length > 10 ? `${pk.slice(0,4)}…${pk.slice(-4)}` : (pk ? 'short' : 'unset');
if (!pk) console.warn('[StripeInit] Missing publishable key.');
window.__BUILD_DIAG__ = { ...(window.__BUILD_DIAG__ || {}), stripePkMasked: masked };

function withTimeout(promise, ms) {
  let t;
  const timeout = new Promise(resolve => {
    t = setTimeout(() => resolve(null), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(t));
}

let _stripePromise = null;
export async function getStripe({ timeoutMs = 8000, retryMs = 2000 } = {}) {
  if (_stripePromise) return _stripePromise;
  if (!pk) {
    _stripePromise = Promise.resolve(null);
    return _stripePromise;
  }
  // First attempt with timeout
  const first = await withTimeout(loadStripe(pk), timeoutMs);
  if (first) return (_stripePromise = Promise.resolve(first));

  console.warn('[StripeInit] First attempt timed out. Retrying after delay…');
  await new Promise(r => setTimeout(r, retryMs));
  const second = await withTimeout(loadStripe(pk), timeoutMs);
  if (!second) console.error('[StripeInit] Second attempt timed out. Stripe unavailable.');
  return (_stripePromise = Promise.resolve(second || null));
}

// Legacy export for backward compatibility
export const stripePromise = pk ? loadStripe(pk) : Promise.resolve(null);
