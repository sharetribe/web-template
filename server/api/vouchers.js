const { Voucherify } = require('../api-util/voucherHelpers');

const { getSdk, getTrustedSdk } = require('../api-util/sdk');

module.exports = {
  customers: {
    createOrGet: async (req, res) => {
      try {
        const { email, name, createdAt, userType, source_id } = req.body;
        const result = await Voucherify.customers.list({ email })

        if (result.total > 0) {
          res.json(result.customers[0]);
        } else {
          const newCustomer = await Voucherify.customers.create({ email, name, createdAt, userType, source_id, metadata: {'userHasOrders': false}});
          res.json(newCustomer);
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
      }
    },
  },

  vouchers: {
    redeem: async (req, res) => {
      try {
        const { order, voucherCode, customerId } = req.body;
        const sdk = await getTrustedSdk(req);

        let customer, redemption;

        const { data } = await sdk.transactions.query({ only: 'order', page: 1, perPage: 1 });
        const userHasOrders = data.meta.totalItems > 0;

        customer = await Voucherify.customers.get(customerId);
        customer = await Voucherify.customers.get(customerId);
        redemption = await Voucherify.redemptions.redeemStackable({
          customer,
          redeemables: [
            {
              object: 'voucher',
              id: voucherCode,
            }
          ],
          metadata: {
            userHasOrders,
          }
        })

        res.json(redemption);
      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
      }
    }
  }
}
