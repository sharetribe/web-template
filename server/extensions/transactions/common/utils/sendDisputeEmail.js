const { MJ_RECIPIENT_EMAILS, MJ_SENDER_EMAIL } = require('../configs/mailjet');
const sendEmail = require('../../mod/mailjet/send');
const getCustomerDisputeEmailTemplate = require('../template/dispute/customer');
const getProviderDisputeEmailTemplate = require('../template/dispute/provider');

const DISPUTE_EMAIL_SUBJECT = 'Review refund request';

module.exports = async ({ isProvider, ...data }) => {
  const senderName = 'Vending Village';
  const recipients = MJ_RECIPIENT_EMAILS.split(',').map(email => ({
    Email: email.trim(),
    Name: 'Admin',
  }));

  const getEmailTemplate = isProvider
    ? getProviderDisputeEmailTemplate
    : getCustomerDisputeEmailTemplate;

  return await sendEmail({
    senderEmail: MJ_SENDER_EMAIL,
    senderName,
    recipients,
    subject: DISPUTE_EMAIL_SUBJECT,
    html: getEmailTemplate(data),
  });
};
