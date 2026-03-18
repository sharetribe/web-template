const { setupVideoConferenceRoom } = require('../../util/api');

const getVideoParams = async txID => {
  const res = await setupVideoConferenceRoom({
    txID,
  });

  return res.roomId;
};

export { getVideoParams };
