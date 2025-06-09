const { trackManagementAPIEvent } = require('../api-util/analytics');
const { ReferralAPIManagerClient: RAMClient } = require('../api-util/referralManager');
const { integrationSdkInit } = require('../api-util/scriptManager');

async function referralProgramOptIn(req, res) {
  const { userId } = req.body;
  const integrationSdk = integrationSdkInit();
  try {
    const sdkUser = await integrationSdk.users.show({ id: userId });
    const userAttributes = sdkUser?.data?.data?.attributes || {};
    const { email, profile } = userAttributes;
    const { firstName, lastName, privateData } = profile || {};
    const { referralCode } = privateData || {};
    const withReferralCode = !!referralCode;

    if (withReferralCode) {
      return res.status(200).send({ code: referralCode });
    }

    const referralManagerClient = new RAMClient();
    const rfUser = await referralManagerClient.optIn(email, firstName, lastName);
    const { code } = rfUser || {};
    await integrationSdk.users.updateProfile({
      id: userId,
      privateData: {
        referralCode: code,
      },
    });
    const eventUser = { id: userId, email };
    trackManagementAPIEvent('REFERRAL_PROGRAM | Auto opt-in', eventUser);
    return res.status(200).send({ code });
  } catch (error) {
    return res.status(400).send('Referral program opt-in error');
  }
}

module.exports = {
  referralProgramOptIn,
};
