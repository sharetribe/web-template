'use strict';

const { getIntegrationSdk } = require('../services/integrationSdk');
const { createTTLCache } = require('../api-util/cache');

const USERS_PER_PAGE = 100;
const MAX_PAGES = 20;
const CACHE_TTL_SECONDS = 300;
const usersCache = createTTLCache(CACHE_TTL_SECONDS);

const isTruthyLocalDesignValue = value =>
  value === true || value === 1 || value === '1' || value === 'true';

const getUserType = user => user?.attributes?.profile?.publicData?.userType;
const getLocalDesignValue = user =>
  user?.attributes?.profile?.metadata?.localDesign ??
  user?.attributes?.profile?.publicData?.localDesign ??
  null;

async function queryAllUsers(sdk) {
  const allUsers = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await sdk.users.query({
      page,
      perPage: USERS_PER_PAGE,
    });

    allUsers.push(...(response?.data?.data || []));
    totalPages = response?.data?.meta?.totalPages || 1;
    page += 1;
  } while (page <= totalPages && page <= MAX_PAGES);

  return allUsers;
}

function buildDropdownUsers(users) {
  return users
    .filter(user => getUserType(user) === 'vendedor-tienda')
    .filter(user => isTruthyLocalDesignValue(getLocalDesignValue(user)))
    .map(user => {
      const id = user?.id?.uuid;
      const displayName =
        user?.attributes?.profile?.displayName || user?.attributes?.profile?.abbreviatedName || id;

      return id
        ? {
            id,
            text: displayName,
          }
        : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.text.localeCompare(b.text, 'es'));
}

module.exports = async (req, res) => {
  const cacheKey = 'local-design-users';
  const { data: cached } = usersCache[cacheKey] || {};

  if (cached) {
    return res.json({ users: cached });
  }

  try {
    const sdk = getIntegrationSdk();
    const users = await queryAllUsers(sdk);
    const dropdownUsers = buildDropdownUsers(users);

    usersCache[cacheKey] = dropdownUsers;
    return res.json({ users: dropdownUsers });
  } catch (error) {
    console.error('[topbar-local-design-users] Failed to load users:', error);
    return res.status(500).json({ error: 'failed_to_load_users' });
  }
};
