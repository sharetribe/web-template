const merge = require('lodash/merge');

const defaultValues = {
  status: 401,
  data: { errors: [{ message: 'Unauthorized' }] },
};
const sendUnauthorized = (res, data = {}) => {
  const {
    status,
    data: { errors },
  } = merge(defaultValues, data);
  res.status(status || 401).send({ errors: errors || [{ message: 'Unauthorized' }] });
};
exports.sendUnauthorized = sendUnauthorized;
