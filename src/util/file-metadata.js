import exifr from 'exifr';
import { getMetadata, getThumbnails } from 'video-metadata-thumbnails';

const WIDTH_TAGS = ['ExifImageWidth', 'Width', 'ImageWidth'];
const HEIGHT_TAGS = ['ExifImageHeight', 'Height', 'ImageHeight'];
const KEYWORDS_TAGS = ['Keywords', 'Subject', 'dc:subject'];

function getImageResolution(fileOrUrl, extraParams = {}) {
  return new Promise((resolve, reject) => {
    const fileUrl = typeof fileOrUrl === 'string' ? fileOrUrl : URL.createObjectURL(fileOrUrl);
    const image = new Image();
    image.src = fileUrl;

    image.onload = () => {
      resolve({
        width: image.width,
        height: image.height,
        keywords: '',
        ...extraParams,
      });
      URL.revokeObjectURL(fileUrl);
    };

    image.onerror = () => {
      URL.revokeObjectURL(fileUrl);
      reject(new Error('Failed to load image.'));
    };
  });
}

function blobToDataURL(blob) {
  return new Promise(resolve => {
    const fileReader = new FileReader();
    fileReader.onload = function(e) {
      resolve(e.target.result);
    };
    fileReader.readAsDataURL(blob);
  });
}

function readMetadata(metadata, originalFile) {
  return new Promise(resolve => {
    if (!metadata) {
      return getImageResolution(originalFile).then(resolve);
    }

    const width = getTagValue(metadata, WIDTH_TAGS, 0);
    const height = getTagValue(metadata, HEIGHT_TAGS, 0);
    const keywords = getTagValue(metadata, KEYWORDS_TAGS, '');

    if (!width || !height) {
      return getImageResolution(originalFile, { keywords }).then(resolve);
    }

    resolve({
      width,
      height,
      keywords,
    });
  });
}

function getTagValue(metadata, possibleTags, defaultValue) {
  for (let tag of possibleTags) {
    if (metadata.hasOwnProperty(tag) && metadata[tag]) {
      return metadata[tag];
    }
  }
  return defaultValue;
}

export const readFileMetadataAsync = uppyFile => {
  const { data, isRemote, source, type } = uppyFile;

  return new Promise(resolve => {
    if (isRemote) {
      switch (source) {
        case 'GoogleDrive': {
          const { imageWidth, imageHeight } = data.custom || {};
          return resolve({
            width: imageWidth || 0,
            height: imageHeight || 0,
          });
        }
        case 'Url': {
          const fileUrl = uppyFile.remote.body.url;
          return getImageResolution(fileUrl).then(({ width, height }) => {
            console.log(width, height);
            resolve({ width, height });
          });
        }
        default:
          return resolve({ width: 0, height: 0, keywords: '' });
      }
    }

    switch (true) {
      case type.startsWith('video'): {
        // noinspection JSCheckFunctionSignatures
        const videoInfo = Promise.all([
          getMetadata(data),
          getThumbnails(data, {
            start: 0,
            end: 1,
            quality: 0.6,
          }),
        ]);

        videoInfo.then(([metadata, thumbnails]) => {
          const { width, height } = metadata;
          const thumbnailBlob = thumbnails[0].blob;

          // Add play icon to the thumbnail
          addPlayIconToThumbnail(thumbnailBlob)
            .then(dataUrl => {
              resolve({ width, height, thumbnail: dataUrl });
            })
            .catch(() => {
              resolve({ width, height, thumbnail: null });
            });
        });

        break;
      }

      case type.startsWith('image'):
      default: {
        exifr
          .parse(data, {
            xmp: true,
            icc: true,
            iptc: true,
            jfif: true,
            ihdr: true,
            gps: false,
          })
          .then(output => readMetadata(output, data))
          .then(resolve)
          .catch(() => getImageResolution(data).then(resolve));
        break;
      }
    }
  });
};

/**
 * Draws a play icon on a thumbnail image.
 * @param {Blob} thumbnailBlob - The thumbnail blob from the video.
 * @returns {Promise<string>} - A promise that resolves to the data URL of the thumbnail with the play icon.
 */
function addPlayIconToThumbnail(thumbnailBlob) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(thumbnailBlob);

    img.onload = () => {
      // Create a canvas and set its dimensions
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw the thumbnail image on the canvas
      context.drawImage(img, 0, 0);

      // Add the play icon overlay
      const iconSize = canvas.width * 0.2; // Adjust size as needed
      context.font = `${iconSize}px sans-serif`;
      context.fillStyle = 'rgba(255, 255, 255, 0.8)';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText('▶', canvas.width / 2, canvas.height / 2);

      // Convert the canvas to a data URL
      const dataUrl = canvas.toDataURL('image/png');
      resolve(dataUrl);

      URL.revokeObjectURL(img.src); // Clean up
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load thumbnail image.'));
    };
  });
}
