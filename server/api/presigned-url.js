const { mediaServices } = require('../services');

/**
 * Generates presigned URLs for uploading files to R2
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const generatePresignedUrl = async (req, res) => {
  try {
    const { storagePath, files = [] } = req.body;

    // Process single file

    if (!files) {
      return res.status(400).json({
        success: false,
        error: 'Files are required',
      });
    }

    try {
      const fileInfos = await Promise.all(
        files.map(file => mediaServices.create(file, storagePath))
      );

      return res.status(200).json(fileInfos);
    } catch (error) {
      console.error(`Error generating presigned URL for files: ${files}`, error);

      return res.status(500).json({
        success: false,
        error: 'Failed to generate presigned URL',
        details: error.message,
      });
    }
  } catch (error) {
    console.error('Error in generatePresignedUrlR2:', error);
    const statusCode = error.message.includes('environment variable') ? 503 : 500;

    return res.status(statusCode).json({
      success: false,
      error: 'Failed to generate presigned URL',
      details: error.message,
    });
  }
};

module.exports = generatePresignedUrl;
