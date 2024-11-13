const express = require('express');
const router = express.Router();

const { categoriesExtraConfig } = require('../config');
const { fetchCommission } = require('../../../api-util/sdk');
const { getSdk } = require('../../../api-util/sdk');
const { denormalisedResponseEntities } = require('../../common/data/data');

router.get('/', async (req, res) => {
  const sdk = getSdk(req, res);
  const commissionResponse = await fetchCommission(sdk);
  const commission = denormalisedResponseEntities(commissionResponse)[0];
  res.status(200).send({config: categoriesExtraConfig, default: commission.attributes.data});
});

module.exports = router;
