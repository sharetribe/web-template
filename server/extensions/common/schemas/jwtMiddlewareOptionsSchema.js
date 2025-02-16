const jwtMiddlewareOptionsSchema = {
  type: 'object',
  properties: {
    requireCurrentUserDetail: {
      type: 'boolean',
    },
    requireTrustedSdk: {
      type: 'boolean',
    },
    alwaysDenormalised: {
      type: 'boolean',
    },
    issuer: {
      type: 'string',
    },
    audience: {
      type: 'string',
    },
  },
  required: [],
  additionalProperties: false,
};

module.exports = jwtMiddlewareOptionsSchema;
