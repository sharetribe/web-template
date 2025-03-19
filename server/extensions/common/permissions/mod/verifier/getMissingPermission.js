const isEmpty = require('lodash/isEmpty');
const { reservedKeywords } = require('../../common/config/definition');

// All of these functions must be in one file to avoid circular dependencies

const getMissingPermission = ({
  userPermissions,
  requiredPermissions,
  currentUser,
  currentImpactedResourceId,
}) => {
  if (isEmpty(requiredPermissions)) {
    return [];
  }
  const { customCheck: currentPermissionCustomCheck } = requiredPermissions;
  if (currentPermissionCustomCheck) {
    // Custom check override all other checks even if there are other layers
    return currentPermissionCustomCheck({
      currentUser,
      requiredPermissions,
      currentImpactedResourceId,
    });
  }
  if (isEmpty(userPermissions)) {
    return [requiredPermissions];
  }
  // eslint-disable-next-line no-use-before-define
  return verifyCurrentPermissionLayers({
    userPermissions,
    requiredPermissions,
    currentUser,
    currentImpactedResourceId,
  });
};

const verifyIndividualPermissionLayer = ({
  userPermissions,
  requiredPermissions,
  currentUser,
  currentImpactedResourceId,
}) => {
  const { customCheck } = requiredPermissions;
  if (customCheck) {
    return customCheck({ currentUser, userPermissions, currentImpactedResourceId });
  }
  const administratorPermissions = userPermissions[reservedKeywords.ALL_ACCESS_RESERVED_KEYWORD];

  if (administratorPermissions) {
    const currentIndividualMissingPermissions = getMissingPermission({
      userPermissions: administratorPermissions,
      requiredPermissions,
      currentUser,
    });
    if (currentIndividualMissingPermissions.length) {
      return [
        { [reservedKeywords.ALL_ACCESS_RESERVED_KEYWORD]: currentIndividualMissingPermissions },
      ];
    }
    return [];
  }

  return Object.entries(userPermissions).reduce(
    (accumulatedMissingPermissions, [currentPermissionEntityKey, currentPermissionEntityValue]) => {
      if (
        !currentImpactedResourceId ||
        !currentImpactedResourceId.match(new RegExp(currentPermissionEntityKey))
      ) {
        return accumulatedMissingPermissions;
      }
      const currentIndividualMissingPermissions = getMissingPermission({
        userPermissions: currentPermissionEntityValue,
        requiredPermissions,
        currentUser,
      });
      if (currentIndividualMissingPermissions.length) {
        accumulatedMissingPermissions.push({
          [currentPermissionEntityKey]: currentIndividualMissingPermissions,
        });
        return accumulatedMissingPermissions;
      }
      return accumulatedMissingPermissions;
    },
    []
  );
};

const verifyCurrentPermissionLayers = ({
  userPermissions,
  requiredPermissions,
  currentUser,
  currentImpactedResourceId,
}) => {
  const { individual, ...restCurrentRequiredPermissionLayer } = requiredPermissions;
  if (individual) {
    // If individual is present, it should be the last layer
    return verifyIndividualPermissionLayer({
      userPermissions,
      requiredPermissions: individual,
      currentUser,
      currentImpactedResourceId,
    });
  }
  // eslint-disable-next-line no-use-before-define
  return verifyNormalPermissionLayer({
    userPermissions,
    requiredPermissions: restCurrentRequiredPermissionLayer,
    currentUser,
    currentImpactedResourceId,
  });
};

const verifyNormalPermissionLayer = ({
  userPermissions,
  requiredPermissions,
  currentUser,
  currentImpactedResourceId,
}) => {
  return Object.entries(requiredPermissions).reduce(
    (accumulatedMissingPermissions, [currentRequiredEntityKey, currentRequiredEntityValue]) => {
      const { permissions: currentRequiredPermissions = [], ...restCurrentRequiredPermission } =
        currentRequiredEntityValue;
      const { permissions: currentAllowedPermissions = [], ...restCurrentUserPermission } =
        userPermissions[currentRequiredEntityKey] || {};
      const currentMissingPermissions = currentRequiredPermissions.filter(
        (requiredPermissionAction) => {
          return !currentAllowedPermissions.includes(requiredPermissionAction);
        }
      );
      if (currentMissingPermissions.length) {
        accumulatedMissingPermissions.push({
          [currentRequiredEntityKey]: currentMissingPermissions,
        });
      }
      return accumulatedMissingPermissions.concat(
        getMissingPermission({
          userPermissions: restCurrentUserPermission,
          requiredPermissions: restCurrentRequiredPermission,
          currentUser,
          currentImpactedResourceId,
        })
      );
    },
    []
  );
};

module.exports = getMissingPermission;
