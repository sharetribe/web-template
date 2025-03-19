const currentUserMiddlewareOptionsSchema = {
  type: 'object',
  properties: {
    requireTrustedSdk: {
      type: 'boolean',
    },
    alwaysDenormalised: {
      type: 'boolean',
    },
  },
  required: [],
  additionalProperties: true,
};

module.exports = currentUserMiddlewareOptionsSchema;
