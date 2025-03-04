const get = require('lodash/get');
const defaultError = require('../../verifier/defaultError');
const { getResourceName } = require('./getResourceName');

const methodMapper = {
  put: 'post',
};

const verify = ({ currentUser, url, loginAsUserId, req }) => {
  const permissions = currentUser?.attributes?.profile?.metadata?.permissions;
  if (!permissions) {
    return {
      error: {
        ...defaultError,
        data: {
          errors: ['Do not find any permissions for the user that is login as another user'],
        },
      },
    };
  }
  const currentPermissions =
    permissions?.user?.loginAs?.all || permissions?.user?.loginAs?.[loginAsUserId.trim()];

  if (!currentPermissions) {
    return {
      error: {
        ...defaultError,
        data: {
          errors: ['Do not find any permissions for the user that is login as another user'],
        },
      },
    };
  }

  const rawResource = url.split('/')[0];
  const resource = getResourceName(rawResource);
  const lowerCaseMethod = req.method.toLowerCase();
  const method = methodMapper[lowerCaseMethod] || lowerCaseMethod;
  const currentInteractingResourcePermission = get(currentPermissions, resource);
  if (!currentInteractingResourcePermission?.permissions?.includes(method)) {
    return {
      error: {
        ...defaultError,
        data: {
          errors: [`Do not find any permissions for the resource ${resource}`],
        },
      },
    };
  }

  return {
    valid: true,
  };
};

module.exports = verify;
