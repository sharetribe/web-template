/////////////////////////////////////////////////////
// Configurations related to transaction processes //
/////////////////////////////////////////////////////

// A presets of supported transaction configurations
//
// Note: With first iteration of hosted configs, we are unlikely to support
//       multiple transaction types, even though this template has some
//       rudimentary support for it.

/**
 * Configuration options for transaction experience:
 * - type:            Unique string. This will be saved to listing's public data on
 *                    EditListingWizard.
 * - label            Label for the transaction type. Used as microcopy for options to select
 *                    transaction type in EditListingWizard.
 * - process          Transaction process. This will be saved to listing's public data
 *                    (together with alias) as transctionProcessAlias.
 *                    The process must match one of the processes that this client app can handle
 *                    (check src/util/transaction.js) and the process must also exists in correct
 *                    marketplace environment.
 * - alias            Valid alias for the aforementioned process.
 * - unitType         Unit type is mainly used as pricing unit. This will be saved to
 *                    listing's public data.
 *                    Recommendation: don't use same unit types in completely different processes
 *                    ('item' sold should not be priced the same as 'item' booked).
 * - showStock        This is relevant only to listings with product transactions.
 *                    If set to false, stock management is not showed and the listing is
 *                    considered unique (stock = 1).
 *                    Default: true.
 */

export const transactionTypes = [
  {
    type: 'product-selling',
    label: 'Sell bicycles',
    process: 'flex-product-default-process',
    alias: 'release-1',
    unitType: 'item',
    showStock: false,
  },
  {
    type: 'daily-booking',
    label: 'Daily booking',
    process: 'flex-booking-default-process',
    alias: 'release-1',
    unitType: 'day',
  },
  {
    type: 'nightly-booking',
    label: 'Nightly booking',
    process: 'flex-booking-default-process',
    alias: 'release-1',
    unitType: 'night',
  },
  {
    type: 'hourly-booking',
    label: 'Hourly booking',
    process: 'flex-booking-default-process',
    alias: 'release-1',
    unitType: 'hour',
  },
];

// SearchPage can enforce listing query to only those listings with valid transactionType
// However, it only works if you have set 'enum' type search schema for the public data fields
//   - transactionType
//
//  Similar setup could be expanded to 2 other extended data fields:
//   - transactionProcessAlias
//   - unitType
//
// Read More:
// https://www.sharetribe.com/docs/how-to/manage-search-schemas-with-flex-cli/#adding-listing-search-schemas
export const enforceValidTransactionType = false;
