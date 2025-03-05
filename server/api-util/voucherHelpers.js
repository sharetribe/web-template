// TODO: switch back to @voucherify/sdk once my PRs are merged
// const { VoucherifyServerSide } = require('@voucherify/sdk');
const { VoucherifyServerSide } = require('@mathiscode/voucherify-sdk');

module.exports = {
  Voucherify: VoucherifyServerSide({
    applicationId: process.env.VOUCHERIFY_APPLICATION_ID,
    secretKey: process.env.VOUCHERIFY_SECRET_KEY,
    apiUrl: process.env.VOUCHERIFY_API_URL || 'https://us1.api.voucherify.io',
  })
}
