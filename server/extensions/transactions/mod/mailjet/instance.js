const Mailjet = require('node-mailjet');
const { MJ_API_PUBLIC_KEY, MJ_API_PRIVATE_KEY } = require('../../common/configs/mailjet');

const mailjetApi = Mailjet.apiConnect(MJ_API_PUBLIC_KEY, MJ_API_PRIVATE_KEY);

module.exports = { mailjetApi };
