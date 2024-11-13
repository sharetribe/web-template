import { types as sdkTypes } from './sdkLoader';
const { Money } = sdkTypes;

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


/**
 * Normalizes the amount to ensure it is not negative.
 * @param {Money} money - A Money instance containing the `amount` and `currency`.
 * @returns {Money} - Returns a Money instance with a non-negative amount.
 */
export const normalizeAmount = (money) => {
  if (!(money instanceof Money)) {
    throw new Error('Expected a Money instance');
  }
  const normalizedAmount = money.amount < 0 ? 0 : money.amount;
  return new Money(normalizedAmount, money.currency);
};
