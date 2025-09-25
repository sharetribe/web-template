const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { getR2Client } = require('../../api-util/mediaSdk');

// Allowed file types
const ALLOWED_FILE_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'],
  // video: ['video/mp4', 'video/mpeg', 'video/quicktime'],
  pdf: ['application/pdf'],
};

const getFileCategory = mimetype => {
  for (const [category, types] of Object.entries(ALLOWED_FILE_TYPES)) {
    if (types.includes(mimetype)) {
      return category;
    }
  }
  return 'other';
};

// Define constants
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'default-bucket-name';
const URL_EXPIRATION = 900; // URL expiration in seconds

/**
 * Generates a presigned URL for uploading a single file to R2
 * @param {Object} R2 - R2 client instance
 * @param {Object} fileData - File data object
 * @param {string} storagePath - Storage path
 * @returns {Promise<Object>} Presigned URL and file information
 */
const create = async (fileData, storagePath) => {
  const R2 = getR2Client();
  const { name, type } = fileData;
  const fileCategory = getFileCategory(type);
  const key = `${storagePath}/${name}`;

  // Generate presigned URL for PUT operation
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: type,
    Metadata: {
      originalname: name,
      category: fileCategory,
    },
  });

  const signedUrl = await getSignedUrl(R2, command, { expiresIn: URL_EXPIRATION });

  return {
    url: signedUrl,
    name: key,
    originalName: name,
    category: fileCategory,
  };
};

module.exports = {
  create,
};
