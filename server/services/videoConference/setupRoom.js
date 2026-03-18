const { getHmsSdk } = require('../../api-util/hmsSdk');
const sharetribeServices = require('../sharetribe');

/**
 * Creates a 100ms room, generates room codes, and saves them to the Sharetribe transaction metadata.
 * @param {string} txID - Transaction ID used as the room ID, name, and Sharetribe transaction reference
 * @param {string} listingTitle - Listing title used as the room description
 * @returns {Promise<Object>} The created room codes object
 */
const setupRoom = async (txID, listingTitle) => {
  const hms = getHmsSdk();

  const room = await hms.rooms.create({
    id: txID.replace(/-/g, '').slice(0, 24),
    name: txID.replace(/-/g, '').slice(0, 24),
    description: listingTitle,
    template_id: process.env.VIDEO_CONFERENCE_TEMPLATE_ID,
    enabled: true,
  });

  const roomCodes = await hms.roomCodes.create(room.id);

  const customerCode = roomCodes.find(elm => elm.role === 'guest').code;
  const providerCode = roomCodes.find(elm => elm.role === 'host').code;

  await sharetribeServices.updateTransactionMetadata(txID, {
    customerCode,
    providerCode,
    roomId: room.id,
  });

  return { message: 'Room created and codes saved to transaction metadata', roomId: room.id };
};

module.exports = { setupRoom };
