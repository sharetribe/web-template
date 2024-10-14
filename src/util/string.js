// Convert kebab-case to camelCase: my-page-asset > myPageAsset
export const camelize = s => s.replace(/-(.)/g, l => l[1].toUpperCase());

export const extractYouTubeID = url => {
  const regExp = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts|live)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;
  const match = url ? url.match(regExp) : null;

  return match ? match[1] : null;
};
