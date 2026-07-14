const { sanitizePushPaymentBodyParams } = require('./pushPaymentMethodValidation');

describe('sanitizePushPaymentBodyParams', () => {
  it('passes through when paymentMethodTypes is not set', () => {
    const bodyParams = {
      transition: 'transition/request-payment',
      params: {},
    };
    expect(sanitizePushPaymentBodyParams(bodyParams)).toEqual(bodyParams);
  });

  it('passes through push transition when paymentMethodTypes is not set', () => {
    const bodyParams = {
      transition: 'transition/request-payment-push',
      params: {},
    };
    expect(sanitizePushPaymentBodyParams(bodyParams)).toEqual(bodyParams);
  });

  it('throws a LocalAPI-shaped error if paymentMethodTypes is an empty array', () => {
    const bodyParams = {
      transition: 'transition/request-payment-push',
      params: { paymentMethodTypes: [] },
    };
    try {
      sanitizePushPaymentBodyParams(bodyParams);
    } catch (e) {
      expect(e.message).toBe('paymentMethodTypes must be a non-empty array.');
      expect(e.status).toBe(400);
      expect(e.statusText).toBe('paymentMethodTypes must be a non-empty array.');
      expect(e.data).toEqual({});
      return;
    }
    throw new Error('Expected sanitizePushPaymentBodyParams to throw');
  });

  it('throws if paymentMethodTypes is not an array', () => {
    const bodyParams = {
      transition: 'transition/request-payment-push',
      params: { paymentMethodTypes: 'ideal' },
    };
    expect(() => sanitizePushPaymentBodyParams(bodyParams)).toThrow(
      'paymentMethodTypes must be a non-empty array'
    );
  });

  it('throws if only invalid paymentMethodTypes are provided', () => {
    const bodyParams = {
      transition: 'transition/request-payment-push',
      params: { paymentMethodTypes: ['invalid', 'also-invalid'] },
    };
    expect(() => sanitizePushPaymentBodyParams(bodyParams)).toThrow('Invalid paymentMethodTypes');
  });

  it('sanitizes paymentMethodTypes to values listed in STRIPE_PUSH_PAYMENT_METHOD_TYPES', () => {
    const bodyParams = {
      transition: 'transition/request-payment-after-inquiry-push',
      params: {
        paymentMethodTypes: ['ideal', 'bancontact', 'ideal', 'invalid', 'mobilepay'],
      },
    };
    const result = sanitizePushPaymentBodyParams(bodyParams);
    expect(result.params.paymentMethodTypes).toEqual(['ideal', 'bancontact', 'mobilepay']);
  });
});
