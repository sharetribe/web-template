const ensureCurrentUser = user => {
  const empty = {
    id: null,
    type: 'currentUser',
    attributes: { profile: {} },
    profileImage: {},
  };
  return { ...empty, ...user };
};

const ensureUser = user => {
  const empty = { id: null, type: 'user', attributes: { profile: {} } };
  return { ...empty, ...user };
};

const ensureTransaction = (
  transaction,
  booking = null,
  listing = null,
  provider = null
) => {
  const empty = {
    id: null,
    type: 'transaction',
    attributes: {},
    booking,
    listing,
    provider,
  };
  return { ...empty, ...transaction };
};

module.exports = {
  ensureCurrentUser,
  ensureUser,
  ensureTransaction,
};
