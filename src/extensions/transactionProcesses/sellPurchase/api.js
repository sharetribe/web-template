const { patchMethod } = require('../../common/api');

export const markProgress = async txId =>
  await patchMethod('/api/transactionProcesses/sellPurchase/markProgress', { txId });
