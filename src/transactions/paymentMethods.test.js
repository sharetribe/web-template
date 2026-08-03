import {
  PAYMENT_METHOD_CARD,
  // PAYMENT_METHOD_IDEAL,
  getPaymentMethodConfig,
  getStripeSupportedPaymentConfig,
  stripePaymentMethodInfo,
  isPaymentMethodSupportedForCurrency,
  isCheckoutPaymentMethodAvailable,
} from './paymentMethods';

describe('paymentMethods helpers', () => {
  it('returns save-payment-method support from config', () => {
    expect(getPaymentMethodConfig(PAYMENT_METHOD_CARD).supportsSavePaymentMethod).toBe(true);
    // expect(getPaymentMethodConfig(PAYMENT_METHOD_IDEAL).supportsSavePaymentMethod).toBe(false);
  });

  it('exposes stripe paymentDirection from catalog', () => {
    expect(getStripeSupportedPaymentConfig(PAYMENT_METHOD_CARD)).toEqual({
      paymentDirection: 'pull',
    });
    // expect(getStripeSupportedPaymentConfig(PAYMENT_METHOD_IDEAL)).toEqual({
    //   paymentDirection: 'push',
    // });
  });

  it('builds a supportedPayments.stripe entry for one method id', () => {
    expect(stripePaymentMethodInfo(PAYMENT_METHOD_CARD)).toEqual({
      card: { paymentDirection: 'pull' },
    });
  });

  it('validates supported currencies per payment method', () => {
    expect(isPaymentMethodSupportedForCurrency(PAYMENT_METHOD_CARD, 'USD')).toBe(true);
    // expect(isPaymentMethodSupportedForCurrency(PAYMENT_METHOD_IDEAL, 'EUR')).toBe(true);
    // expect(isPaymentMethodSupportedForCurrency(PAYMENT_METHOD_IDEAL, 'USD')).toBe(false);
  });

  it('checks checkout availability against process and currency', () => {
    const process = {
      supportedPayments: {
        stripe: {
          card: { paymentDirection: 'pull' },
          ideal: { paymentDirection: 'push' },
        },
      },
    };

    expect(
      isCheckoutPaymentMethodAvailable({
        process,
        paymentMethodId: 'ideal',
        currency: 'EUR',
      })
    ).toBe(true);
  });
});
