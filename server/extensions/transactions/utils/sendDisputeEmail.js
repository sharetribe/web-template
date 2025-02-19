const getDisputeEmailTemplate = require('../common/template/dispute');
const { MJ_RECIPIENT_EMAILS, MJ_SENDER_EMAIL } = require('../common/configs/mailjet');
const sendEmail = require('../mod/mailjet/send');

const DISPUTE_EMAIL_SUBJECT = 'Review refund request ';

module.exports = async data => {
  const senderName = 'Vending Village';
  const recipients = MJ_RECIPIENT_EMAILS.split(',').map(email => ({
    Email: email.trim(),
    Name: 'Admin',
  }));

  return await sendEmail({
    senderEmail: MJ_SENDER_EMAIL,
    senderName,
    recipients,
    subject: DISPUTE_EMAIL_SUBJECT,
    html: getDisputeEmailTemplate(data),
  });
};
