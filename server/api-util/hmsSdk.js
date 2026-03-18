const HMS = require('@100mslive/server-sdk');

const { VIDEO_CONFERENCE_CLIENT_KEY, VIDEO_CONFERENCE_CLIENT_SECRET } = process.env;

let hmsClient = null;

exports.getHmsSdk = () => {
  if (!hmsClient) {
    if (!VIDEO_CONFERENCE_CLIENT_KEY || !VIDEO_CONFERENCE_CLIENT_SECRET) {
      throw new Error('HMS credentials are not properly configured');
    }
    hmsClient = new HMS.SDK(VIDEO_CONFERENCE_CLIENT_KEY, VIDEO_CONFERENCE_CLIENT_SECRET);
  }
  return hmsClient;
};
