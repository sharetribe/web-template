const { postMethod } = require('../../common/api');

export const markProgress = async txId =>
  await postMethod('/api/transactions/sell-purchase/progress', { txId });
