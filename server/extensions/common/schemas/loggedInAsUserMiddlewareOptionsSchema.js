const loggedInAsUserMiddlewareOptionsSchema = {
  type: 'object',
  properties: {
    requireTrustedSdk: {
      type: 'boolean',
    },
    currentLoginAsUserId: {
      type: 'string',
    },
    alwaysDenormalised: {
      type: 'boolean',
    },
  },
  required: ['currentLoginAsUserId'],
  additionalProperties: true,
};

module.exports = loggedInAsUserMiddlewareOptionsSchema;
