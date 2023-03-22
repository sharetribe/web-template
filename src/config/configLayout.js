///////////////////////////////////////////////////////
// This file contains configs that affect layout     //
// NOTE: these are just some of the relevant configs //
// Most of the work happens in components.           //
///////////////////////////////////////////////////////

// There are 2 SearchPage variants that can be used:
// 'map' & 'grid'
export const searchPage = {
  variantType: 'map',
};

// ListingPage has 2 layout options: 'coverPhoto' and 'carousel'.
// - 'coverPhoto' means a layout where there's a hero section with cropped image in the beginning of the page
// - 'carousel' shows image carousel, where listing images are shown with the original aspect ratio
export const listingPage = {
  variantType: 'carousel',
};

export const listingImage = {
  // Aspect ratio for listing image variants
  aspectWidth: 400,
  aspectHeight: 400,
  // Listings have custom image variants, which are named here.
  variantPrefix: 'listing-card',
};
