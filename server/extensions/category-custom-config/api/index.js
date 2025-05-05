const express = require('express');
const router = express.Router();

const { categoriesExtraConfig } = require('../config');
const { fetchCommission } = require('../../../api-util/sdk');
const { getSdk } = require('../../../api-util/sdk');
const { denormalisedResponseEntities } = require('../../common/data/data');
const { validateMinFlatFee } = require('../helpers/validate');

router.get('/', async (req, res) => {
  const sdk = getSdk(req, res);
  const commissionResponse = await fetchCommission(sdk);
  const commission = denormalisedResponseEntities(commissionResponse)[0];

  if (!validateMinFlatFee()) {
    res.status(400).json({ error: 'Internal server error' });
  }

  res.status(200).send({ config: categoriesExtraConfig, default: commission.attributes.data });
});

module.exports = router;
