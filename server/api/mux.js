const { getMux } = require('../api-util/muxSdk');

const mux = getMux();

const marketplaceUrl = process.env.REACT_APP_MARKETPLACE_ROOT_URL;

const getMuxUploadUrl = async (req, res) => {
  const { playback_policy = ['public'] } = req.body || {};

  try {
    const upload = await mux.video.uploads.create({
      // Set the CORS origin to your application.
      cors_origin: marketplaceUrl,
      new_asset_settings: {
        playback_policy,
      },
    });

    res.status(200).json(upload);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get mux upload url' + JSON.stringify(error),
    });
  }
};

const getMuxAsset = async (req, res) => {
  try {
    const { uploadId } = req.query;
    const uploadRes = await mux.video.uploads.retrieve(uploadId);

    const assetRes = await mux.video.assets.retrieve(uploadRes.asset_id);

    res.status(200).json({
      playback_id: assetRes.playback_ids[0].id,
      asset_id: assetRes.id,
      state: assetRes.progress.state,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get mux asset' });
  }
};

const deleteMuxAsset = async (req, res) => {
  try {
    const { assetId } = req.body;
    await mux.video.assets.delete(assetId);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete mux asset' });
  }
};

/**
 * Generates a Mux JWT signed token for a given playback ID.
 * Accepts query params:
 *   - playbackId {string} required  – the signed playback ID
 *   - type       {string} optional  – token type: video (default), thumbnail, gif, storyboard
 */
const getMuxJwtToken = async (req, res) => {
  try {
    const { playbackId } = req.query;
    const keyId = process.env.MUX_SIGNING_KEY_ID;
    const keySecret = process.env.MUX_SIGNING_KEY_SECRET;

    if (!playbackId) {
      return res.status(400).json({ error: 'playbackId is required' });
    }

    if (!keyId || !keySecret) {
      return res.status(500).json({ error: 'Mux signing credentials are not configured' });
    }

    const token = await mux.jwt.signPlaybackId(playbackId, {
      keyId,
      keySecret,
      expiration: '1h',
      type: 'video',
    });

    return res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate Mux JWT token' });
  }
};

module.exports = {
  getMuxUploadUrl,
  getMuxAsset,
  getMuxJwtToken,
  // deleteMuxAsset,
};
