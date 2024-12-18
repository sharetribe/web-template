const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const multer = require('multer');
const path = require('path');
const { attemptGetCredentials } = require('./STSs');
const uploadS3 = async (req, res, next) => {
  if (req.files && req.files.length > 0) {
    const credentials = await attemptGetCredentials();

    // Create an S3 client object
    const s3Client = new S3Client({ credentials });

    try {
      // Store uploaded file URLs
      const uploadedFiles = await Promise.all(
        req.files.map(async file => {
          const fileExt = path.extname(file.originalname);
          const fileName = `${file.originalname
            .replace(fileExt, '')
            .toLowerCase()
            .split(' ')
            .join('-')}-${Date.now()}`;

          const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `uploads/${fileName}${fileExt}`,
            Body: file.buffer,
          };

          const uploadCommand = new PutObjectCommand(params);
          await s3Client.send(uploadCommand);

          // Generate the file URL
          return `${process.env.ASSET_URL}/${params.Key}`;
        })
      );

      req.fileUrls = uploadedFiles; // Attach URLs to the request object
      next();
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  } else {
    next();
  }
};

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10000000, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedImageTypes = ['image/png', 'image/jpg', 'image/jpeg'];
    const allowedDocTypes = ['application/pdf'];
    const allowedFileTypes = [...allowedImageTypes, ...allowedDocTypes];

    if (file.fieldname === 'image') {
      if (allowedImageTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only .jpg, .png or .jpeg format allowed!'));
      }
    } else if (file.fieldname === 'doc') {
      if (allowedDocTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only .pdf format allowed!'));
      }
    } else if (file.fieldname === 'file') {
      if (allowedFileTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only .jpg, .png, .jpeg or .pdf format allowed!'));
      }
    } else if (file.fieldname === 'files') {
      if (allowedFileTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only .jpg, .png, .jpeg or .pdf format allowed!'));
      }
    } else {
      cb(new Error('There was an unknown error!'));
    }
  },
});

module.exports = { uploadS3, upload };
