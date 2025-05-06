const express = require('express');
const router = express.Router();

const { fetchCommission } = require('../../../api-util/sdk');
const { getSdk } = require('../../../api-util/sdk');
const { denormalisedResponseEntities } = require('../../common/data/data');
const { getValidConfigs } = require('../helpers/validate');

router.get('/', async (req, res) => {
  const sdk = getSdk(req, res);
  const commissionResponse = await fetchCommission(sdk);
  const commission = denormalisedResponseEntities(commissionResponse)[0];

  const config = getValidConfigs();

  res.status(200).send({ config, default: commission.attributes.data });
});

module.exports = router;
