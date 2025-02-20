const jwtPayloadSchema = {
  type: 'object',
  properties: {
    currentUser: {
      type: 'object',
      properties: {
        id: {
          type: 'object',
          properties: { uuid: { type: 'string' } },
          additionalProperties: false,
        },
        attributes: {
          type: 'object',
          properties: {
            profile: {
              type: 'object',
              properties: {
                metadata: {
                  type: 'object',
                  properties: {
                    permissions: {
                      type: 'object',
                    },
                  },
                  additionalProperties: false,
                },
              },
              additionalProperties: false,
            },
            additionalProperties: false,
          },
          additionalProperties: false,
        },
        additionalProperties: false,
      },
    },
    loggedInAsUser: {
      type: 'object',
      properties: {
        id: {
          type: 'object',
          properties: { uuid: { type: 'string' }, additionalProperties: false },
        },
        additionalProperties: false,
      },
    },
  },
  required: ['currentUser'],
  additionalProperties: false,
};

module.exports = jwtPayloadSchema;
