const { VoucherifyServerSide } = require('@voucherify/sdk');

module.exports = {
  Voucherify: VoucherifyServerSide({
    applicationId: process.env.VOUCHERIFY_APPLICATION_ID,
    secretKey: process.env.VOUCHERIFY_SECRET_KEY,
    apiUrl: process.env.VOUCHERIFY_API_URL || 'https://us1.api.voucherify.io',
  })
}
