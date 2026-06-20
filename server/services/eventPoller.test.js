'use strict';

const { matchTransitionRule } = require('./eventPoller');

describe('matchTransitionRule', () => {
  // ── Purchase confirmed ──────────────────────────────────────────────
  test('matches transition/confirm-payment to purchase notifications', () => {
    const rule = matchTransitionRule('transition/confirm-payment');
    expect(rule).toMatchObject({
      buyerTemplate: 'av_purchase_confirmed',
      sellerTemplate: 'av_sale_received',
    });
  });

  test('does NOT match mark-received-from-purchased to purchase notifications', () => {
    // Regression: old code used `endsWith('/purchased')`, which wrongly fired
    // the purchase notification when the BUYER marked the item received.
    expect(matchTransitionRule('transition/mark-received-from-purchased')).toBeNull();
  });

  // ── Delivered ───────────────────────────────────────────────────────
  test('matches mark-delivered (and operator variant) to delivered notification', () => {
    expect(matchTransitionRule('transition/mark-delivered')).toMatchObject({
      buyerTemplate: 'av_delivered',
    });
    expect(matchTransitionRule('transition/operator-mark-delivered')).toMatchObject({
      buyerTemplate: 'av_delivered',
    });
  });

  test('does NOT treat operator-cancel-from-delivered as a delivered notification', () => {
    // Regression: old `endsWith('/delivered')` false-fired "delivered" on a cancel.
    expect(matchTransitionRule('transition/operator-cancel-from-delivered')).toBeNull();
  });

  // ── Cancelled ───────────────────────────────────────────────────────
  test('matches cancellation transitions to cancelled notification', () => {
    for (const t of ['transition/cancel', 'transition/auto-cancel', 'transition/operator-cancel']) {
      expect(matchTransitionRule(t)).toMatchObject({
        buyerTemplate: 'av_cancelled',
        sellerTemplate: 'av_cancelled',
      });
    }
  });

  // ── Booking accept / decline ────────────────────────────────────────
  test('matches accept transitions to booking-accepted notification', () => {
    expect(matchTransitionRule('transition/accept')).toMatchObject({
      buyerTemplate: 'av_booking_accepted',
    });
    expect(matchTransitionRule('transition/operator-accept')).toMatchObject({
      buyerTemplate: 'av_booking_accepted',
    });
  });

  test('matches decline transitions to booking-declined notification', () => {
    expect(matchTransitionRule('transition/decline')).toMatchObject({
      buyerTemplate: 'av_booking_declined',
    });
    expect(matchTransitionRule('transition/operator-decline')).toMatchObject({
      buyerTemplate: 'av_booking_declined',
    });
  });

  // ── Negotiation offer made (notify seller) ──────────────────────────
  test('matches make-offer transitions to seller new-offer notification', () => {
    for (const t of [
      'transition/make-offer',
      'transition/make-offer-after-inquiry',
      'transition/make-offer-from-request',
    ]) {
      expect(matchTransitionRule(t)).toMatchObject({ sellerTemplate: 'av_new_message' });
    }
  });

  // ── Non-matching ────────────────────────────────────────────────────
  test('returns null for unrelated transitions', () => {
    expect(matchTransitionRule('transition/request-payment')).toBeNull();
    expect(matchTransitionRule('transition/inquire')).toBeNull();
    expect(matchTransitionRule('')).toBeNull();
    expect(matchTransitionRule(undefined)).toBeNull();
  });
});
