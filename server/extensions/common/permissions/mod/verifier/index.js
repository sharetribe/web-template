const defaultError = require('./defaultError');
const getMissingPermission = require('./getMissingPermission');

const verify = ({ currentUser, requiredPermissions, currentImpactedResourceId }) => {
  const missingPermissions = getMissingPermission({
    userPermissions: currentUser?.attributes?.profile?.metadata?.permissions,
    requiredPermissions,
    currentUser,
    currentImpactedResourceId,
  });
  if (missingPermissions.length) {
    return {
      error: {
        ...defaultError,
        data: {
          errors: missingPermissions,
        },
      },
    };
  }

  return {
    valid: true,
  };
};

module.exports = verify;
