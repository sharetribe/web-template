/**
 * Separate teambuilding listings from other listings
 */
export const filterListings = (location, listings) => {
  const isTeamBuilding = location.pathname.startsWith('/ts');
  return listings.filter((ll) => {
    const listingType = ll.attributes.publicData?.listingType;

    if (isTeamBuilding) {
      return listingType === 'teambuilding';
    } else {
      return listingType !== 'teambuilding';
    }
  });
};
