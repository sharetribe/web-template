/* eslint-disable no-unused-vars */
const userWithAbilityToLoginAsAnyoneAndCanUseBulkUpload = {
  id: {
    uuid: '1506-1996-1506-1996',
  },
  attributes: {
    profile: {
      metadata: {
        permissions: {
          listing: {
            'bulk-upload': {
              permissions: ['post'],
            },
            permissions: ['get', 'post', 'delete'],
          },
          user: {
            permissions: ['get', 'post', 'delete'],
            loginAs: {
              all: {
                transaction: {
                  permissions: ['get', 'post', 'put'],
                },
                listing: {
                  permissions: ['post', 'put'],
                },
                user: {
                  permissions: ['get', 'post', 'put'],
                },
              },
            },
          },
        },
      },
    },
  },
};

const userWithAbilityToLoginAsASpecificPersonAndCanUseBulkUpload = {
  id: {
    uuid: '1506-1996-1506-1996',
  },
  attributes: {
    profile: {
      metadata: {
        permissions: {
          listing: {
            'bulk-upload': {
              permissions: ['post'],
            },
            permissions: ['get', 'post', 'delete'],
          },
          user: {
            permissions: ['get', 'post', 'delete'],
            loginAs: {
              '6639d48a-45b7-4062-84b5-3d82ab9f104c': {
                transaction: {
                  permissions: ['get', 'post', 'put'],
                },
                listing: {
                  permissions: ['post', 'put'],
                },
                user: {
                  permissions: ['get', 'post', 'put'],
                },
              },
            },
          },
        },
      },
    },
  },
};

const setupForLoginAsEndpoint = {
  user: {
    loginAs: {
      individual: {
        listing: {
          permissions: ['get', 'post', 'put'],
        },
        user: {
          permissions: ['get', 'post', 'put'],
        },
        transaction: {
          permissions: ['get', 'post', 'put'],
        },
      },
    },
  },
};
