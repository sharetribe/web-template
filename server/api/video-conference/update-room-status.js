const { handleError } = require('../../api-util/sdk');
const { videoConferenceServices } = require('../../services');

const updateRoomStatus = async (req, res) => {
  try {
    const { roomId, isEnable = false } = req.body;
    const room = await videoConferenceServices.updateRoomStatus(roomId, isEnable);
    res.status(200).json(room);
  } catch (error) {
    console.log(error, 'Error updating room status!!');
    handleError(res, error);
  }
};

module.exports = updateRoomStatus;
