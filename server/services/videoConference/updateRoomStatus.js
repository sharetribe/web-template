const { getHmsSdk } = require('../../api-util/hmsSdk');

/**
 * Enables or disables an existing 100ms room
 * @param {string} roomId - The 100ms room ID
 * @param {boolean} isEnable - Whether to enable or disable the room
 * @returns {Promise<Object>} The updated room object
 */
const updateRoomStatus = async (roomId, isEnable) => {
  const hms = getHmsSdk();
  return hms.rooms.enableOrDisable(roomId, isEnable);
};

module.exports = { updateRoomStatus };
