import exifr from 'exifr';

const WIDTH_TAGS = ['ExifImageWidth', 'Width', 'ImageWidth'];
const HEIGHT_TAGS = ['ExifImageHeight', 'Height', 'ImageHeight'];
const KEYWORDS_TAGS = ['Keywords', 'Subject', 'dc:subject'];

function getFileResolution(file, onLoad, extraParams = {}) {
  const fileUrl = URL.createObjectURL(file);
  const image = new Image();
  image.src = fileUrl;
  image.onload = () => {
    onLoad({
      width: image.width,
      height: image.height,
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
  const keywords = getTagValue(metadata, KEYWORDS_TAGS, []);

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

export const getFileMetadata = (file, onLoad) => {
  exifr
    .parse(file, {
      xmp: true,
      icc: true,
      iptc: true,
      jfif: true,
      ihdr: true,
      gps: false,
    })
    .then(output => readMetadata(output, file, onLoad))
    .catch(() => getFileResolution(file, onLoad));
};
