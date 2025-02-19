const { postMethod } = require('../../common/api');

export const updateProgress = async txId =>
  await postMethod('/api/transactions/sell-purchase/progress', { txId });
