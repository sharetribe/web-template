const { getHmsSdk } = require('../../api-util/hmsSdk');
const sharetribeServices = require('../sharetribe');

/**
 * Generates a new guest room code for an existing 100ms room and saves it to the
 * Sharetribe transaction metadata. The provider code is preserved from the original room.
 * @param {string} txID - The new transaction ID to associate the code with
 * @param {string} roomId - The existing 100ms room ID
 * @param {string} providerCode - The existing host code from the original transaction
 * @returns {Promise<Object>}
 */
const joinRoom = async (txID, roomId, providerCode) => {
  const hms = getHmsSdk();

  const newCode = await hms.roomCodes.createForRole(roomId, 'guest');
  const customerCode = newCode.code;

  await sharetribeServices.updateTransactionMetadata(txID, {
    customerCode,
    providerCode,
    roomId,
  });

  return { message: 'Joined existing room with new guest code', roomId };
};

module.exports = { joinRoom };
