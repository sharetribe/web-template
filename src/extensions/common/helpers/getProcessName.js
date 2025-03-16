import { resolveLatestProcessName } from '../../../transactions/transaction';
import { ensureListing, ensureTransaction } from '../../../util/data';

export const getListingProcessName = listing => {
  const ensuredListing = ensureListing(listing);

  return ensuredListing.attributes.publicData.transactionProcessAlias?.split('/')[0];
};

export const getTxProcessName = tx => {
  const ensuredTx = ensureTransaction(tx);

  return resolveLatestProcessName(ensuredTx.attributes.processName);
};
