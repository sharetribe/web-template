const express = require('express');
const router = express.Router();

const { getSdk, fetchCommission } = require('../../../api-util/sdk');

router.get('/commission', async (req, res) => {
  try {
    const sdk = getSdk(req, res);
    const response = await fetchCommission(sdk);

    res.status(200).json(response.data.data[0].attributes.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
