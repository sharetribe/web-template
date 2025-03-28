const { Storage } = require('@google-cloud/storage');
const { extname } = require('path');

const { integrationSdkInit } = require('../api-util/scriptManager');
const { resolveLatestProcessName, getProcess } = require('../api-util/transactions/transaction');

const storage = new Storage();
const publicStorageRegex = /^https:\/\/storage.googleapis.com\/(.*)$/;
const gsBaseURL = 'gs://';

function tlFilename(listingId, filename) {
  const fileExt = extname(filename);
  return `TheLuupe_${listingId}${fileExt}`;
}

function uriToFile(source) {
  const parsedSource = source.replace(publicStorageRegex, `${gsBaseURL}$1`);
  const { host, pathname } = new URL(parsedSource);
  return storage.bucket(host).file(pathname.substring(1));
}

async function generateSignedDownloadUrl(source, filename) {
  const file = uriToFile(source);
  const [signedUrl] = await file.getSignedUrl({
    version: 'v2',
    action: 'read',
    expires: Date.now() + 1000 * 60 * 60 * 8, // 8 hours
    promptSaveAs: filename,
  });
  return {
    filename,
    url: signedUrl,
  };
}

const getStateData = (transaction, process) => {
  const { getState, states } = process;
  const processState = getState(transaction);
  return {
    processState,
    states,
  };
};

async function generateDownloadUrls(req, res) {
  const { transactionId, userId } = req.body;
  const integrationSdk = integrationSdkInit();
  try {
    const sdkTransaction = await integrationSdk.transactions.show({
      id: transactionId,
      include: ['customer', 'listing'],
    });
    const transaction = sdkTransaction?.data?.data;
    const included = sdkTransaction?.data?.included || [];
    const listing = included.find(entry => entry.type === 'listing');
    const customer = transaction?.relationships?.customer?.data;
    const customerId = customer?.id?.uuid;
    const isCustomer = userId === customerId;
    const processName = resolveLatestProcessName(transaction?.attributes?.processName);

    const isValidTransaction = isCustomer && processName;
    if (!isValidTransaction) return res.status(400).send('Invalid transaction');

    const process = getProcess(processName);
    const { processState, states } = getStateData(transaction, process);
    switch (processState) {
      case states.PURCHASED:
      case states.COMPLETED:
      case states.REVIEWED: {
        const originalFileName = listing?.attributes?.publicData?.originalFileName;
        const source = listing?.attributes?.privateData?.originalAssetUrl;
        const listingId = listing?.id?.uuid;
        const filename = tlFilename(listingId, originalFileName);
        const signedDownloadUrl = await generateSignedDownloadUrl(source, filename);
        return res.json(signedDownloadUrl);
      }
      default:
        return res.status(400).send('Invalid transaction');
    }
  } catch (error) {
    return res.status(400).send('Download error');
  }
}

module.exports = {
  generateDownloadUrls,
};
