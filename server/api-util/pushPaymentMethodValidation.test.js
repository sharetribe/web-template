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

  it('rejects paymentMethodTypes when the allowlist is empty (default)', () => {
    const bodyParams = {
      transition: 'transition/request-payment-after-inquiry-push',
      params: {
        paymentMethodTypes: ['ideal', 'bancontact', 'mobilepay'],
      },
    };
    expect(() => sanitizePushPaymentBodyParams(bodyParams)).toThrow('Invalid paymentMethodTypes');
  });

  it('includes customization guidance in development errors', () => {
    const previousEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    try {
      const bodyParams = {
        transition: 'transition/request-payment-push',
        params: { paymentMethodTypes: ['ideal'] },
      };
      expect(() => sanitizePushPaymentBodyParams(bodyParams)).toThrow(
        /pushPaymentMethodValidation\.js[\s\S]*CheckoutPageRedirectReturn\/README\.md/
      );
    } finally {
      process.env.NODE_ENV = previousEnv;
    }
  });
});
