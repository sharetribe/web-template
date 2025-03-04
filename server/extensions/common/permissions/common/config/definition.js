const USER_ENTITY = 'user';
const TRANSACTION_ENTITY = 'transaction';
const LISTING_ENTITY = 'listing';

const GET_ACTION = 'get';
const CREATE_ACTION = 'create';
const UPDATE_ACTION = 'update';
const DELETE_ACTION = 'delete';

const ALL_ACCESS_RESERVED_KEYWORD = 'all';
const INDIVIDUAL_RESERVED_KEYWORD = 'individual';

module.exports = {
  entitiesConfig: {
    [USER_ENTITY]: {
      ALLOWED_ACTIONS: [GET_ACTION, CREATE_ACTION, UPDATE_ACTION, DELETE_ACTION],
    },
    [TRANSACTION_ENTITY]: {
      ALLOWED_ACTIONS: [GET_ACTION, CREATE_ACTION, UPDATE_ACTION],
    },
    [LISTING_ENTITY]: {
      ALLOWED_ACTIONS: [GET_ACTION, CREATE_ACTION, UPDATE_ACTION, DELETE_ACTION],
    },
  },
  entities: {
    USER_ENTITY,
    TRANSACTION_ENTITY,
    LISTING_ENTITY,
  },
  actions: {
    GET_ACTION,
    CREATE_ACTION,
    UPDATE_ACTION,
    DELETE_ACTION,
  },
  possibleConfig: {
    individual: {
      customCheck: ({ currentUser, userPermissions, currentImpactedResourceId }) => {
        return 'boolean';
      },
    },
  },
  reservedKeywords: {
    ALL_ACCESS_RESERVED_KEYWORD,
    INDIVIDUAL_RESERVED_KEYWORD,
  },
};
