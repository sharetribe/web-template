///////////////////////////////////////
// Built-in access-control defaults //
///////////////////////////////////////

// Optional
// Hosted asset: /general/access-control.json (appCdnAssets.accessControl)
// To use only these built-ins, omit/ignore the hosted asset
// (see accessControl/accessControl.js).
export const marketplace = {
  // When true, unauthenticated users are gated from browsing listings/search/profiles
  private: false,
  // When true, listing file upload/download UI is disabled
  fileUploadAndDownloadDisabled: false,
};
