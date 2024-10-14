import exifr from 'exifr';

const WIDTH_TAGS = ['ExifImageWidth', 'Width', 'ImageWidth'];
const HEIGHT_TAGS = ['ExifImageHeight', 'Height', 'ImageHeight'];
const KEYWORDS_TAGS = ['Keywords', 'Subject', 'dc:subject'];

function getFileResolution(fileOrUrl, onLoad, extraParams = {}) {
  const fileUrl = typeof fileOrUrl === 'string' ? fileOrUrl : URL.createObjectURL(fileOrUrl);
  const image = new Image();
  image.src = fileUrl;
  image.onload = () => {
    onLoad({
      width: image.width,
      height: image.height,
      keywords: '',
      ...extraParams,
    });
    URL.revokeObjectURL(fileUrl);
  };

  image.onerror = () => {
    URL.revokeObjectURL(fileUrl);
  };
}

function readMetadata(metadata, originalFile, onLoad) {
  if (!metadata) {
    return getFileResolution(originalFile, onLoad);
  }

  const width = getTagValue(metadata, WIDTH_TAGS, 0);
  const height = getTagValue(metadata, HEIGHT_TAGS, 0);
  const keywords = getTagValue(metadata, KEYWORDS_TAGS, '');

  if (!width || !height) {
    getFileResolution(originalFile, onLoad, { keywords });
    return;
  }

  onLoad({
    width,
    height,
    keywords,
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

export const getFileMetadata = (uppyFile, onLoad) => {
  const { data, isRemote, source } = uppyFile;

  if (isRemote) {
    switch (source) {
      case 'GoogleDrive': {
        const { imageWidth, imageHeight } = data.custom || {};
        return onLoad({
          width: imageWidth || 0,
          height: imageHeight || 0,
        });
      }
      case 'Url':
        const fileUrl = uppyFile.remote.body.url;
        return getFileResolution(fileUrl, ({ width, height }) => {
          console.log(width, height);
          return onLoad({ width, height });
        });
    }

    onLoad({ width: 0, height: 0, keywords: '' });
    return;
  }

  exifr
    .parse(data, {
      xmp: true,
      icc: true,
      iptc: true,
      jfif: true,
      ihdr: true,
      gps: false,
    })
    .then(output => readMetadata(output, data, onLoad))
    .catch(() => getFileResolution(data, onLoad));
};
