/**
 * This file exports endpoints to be used for receiving and sending emails.
 *
 * Templates are stored in ../../templates, and may be copied from
 * Sharetribe's builtin email templates, with the following changes:
 *
 * - remove the set-translations and set-locale tags
 * - url-encode param should be quoted, e.g. {{url-encode "transaction.id"}}
 *
 */

const fs = require('fs');
const formidable = require('formidable');
const handlebars = require('handlebars');
const path = require('path');
const { v4: uuid } = require('uuid');

const { asyncHandler } = require('../../api-util/asyncHandler');
const { getISdk, getSdk } = require('../../api-util/sdk');

const isdk = getISdk();

const mail = require('@sendgrid/mail');
mail.setApiKey(process.env.SENDGRID_API_KEY);
const { t } = require('../../api-util/emailHelpers');

module.exports = {
  incoming: asyncHandler(async (req, res) => {
    const form = new formidable.IncomingForm();

    form.parse(req, async (err, fields, files) => {
      const from = fields.from[0];
      const text = fields.text[0];
      let id = text.match(/sale\/(\w{8}-\w{4}-\w{4}-\w{4}-\w{12})/)?.[1]; // Match sale/UUID
      if (!id) id = text.match(/order\/(\w{8}-\w{4}-\w{4}-\w{4}-\w{12})/)?.[1]; // Match order/UUID

      if (!id) {
        const template = handlebars.compile(fs.readFileSync(path.join(__dirname, '../../templates/not-sent.html'), 'utf8').toString());
        const html = template({
          message: {
            content: text,
            marketplace: {
              name: process.env.REACT_APP_MARKETPLACE_NAME,
              url: process.env.REACT_APP_MARKETPLACE_ROOT_URL
            }
          },
        });

        await mail.send({
          to: from,
          from: process.env.SENDGRID_FROM_EMAIL,
          replyTo: process.env.SENDGRID_REPLY_TO_EMAIL,
          subject: 'Your message has not been sent!',
          html
        });

        return res.status(200).end();
      }

      const { data: transactionData, errors: transactionErrors, status: transactionStatus } = await isdk.transactions.show({ id, include: 'customer,provider' });
      if (!transactionData || transactionErrors || transactionStatus !== 200) return res.status(transactionStatus ?? 500).end();
      const { data: transaction } = transactionData;
      const { customer, provider } = transaction.relationships;

      const { data: customerData, errors: customerErrors, status: customerStatus } = await isdk.users.show({ id: customer.data.id });
      const { data: providerData, errors: providerErrors, status: providerStatus } = await isdk.users.show({ id: provider.data.id });
      if (!customerData || customerErrors || customerStatus !== 200 || !providerData || providerErrors || providerStatus !== 200) return res.status(customerStatus ?? providerStatus ?? 500).end();

      const { email: customerEmail } = customerData.data.attributes;
      const { email: providerEmail } = providerData.data.attributes;

      const cleanFrom = from.includes('<') ? from.split('<')[1].split('>')[0] : from;
      if (![customerEmail, providerEmail].includes(cleanFrom)) return res.status(403).end();

      const isFromCustomer = cleanFrom === customerEmail;
      const senderData = isFromCustomer ? customerData.data : providerData.data;

      const sender = {
        id: senderData.id.uuid,
        type: senderData.type,
        attributes: {
          ...senderData.attributes,
          createdAt: new Date(senderData.attributes.createdAt).toISOString(),
        },
      };

      // Our best effort to clean up the email content
      const content = text
        .replace(/\n>.*/g, '') // Remove quoted reply
        .replace(/-+\s.+\s-+/g, '') // Remove standard quote header
        .replace(/On\s.*\swrote:/g, '') // Remove standard quote date
        .replace(/\+.+@.+>$/, '') // Remove email footer
        .trim();

      const message = {
        id: uuid(),
        type: 'message',
        sender,
        attributes: { content, createdAt: new Date().toISOString() },
      };

      // Ideally, I would like to use isdk.messages.send, but the
      // integration API doesn't support it, and I don't think we
      // can fake-authenticate as the customer or provider on the
      // backend, or at least I haven't figured it out yet, so we
      // can just store the messages in the transaction metadata
      await isdk.transactions.updateMetadata({
        id,
        metadata: {
          emails: [...(transaction.attributes.metadata?.emails || []), message],
        },
      });

      const template = handlebars.compile(fs.readFileSync(path.join(__dirname, '../../templates/new-message.html'), 'utf8').toString());
      const html = template({
        message: {
          content: message.attributes.content,
          sender: {
            'display-name': senderData.attributes.profile.displayName
          },
          marketplace: {
            name: process.env.REACT_APP_MARKETPLACE_NAME,
            url: process.env.REACT_APP_MARKETPLACE_ROOT_URL
          },
          transaction: { id },
          'recipient-role': isFromCustomer ? 'provider' : 'customer'
        }
      });

      const result = await mail.send({
        to: isFromCustomer ? providerEmail : customerEmail,
        from: `${senderData.attributes.profile.displayName} ${t('General.Via', 'via')} ${process.env.REACT_APP_MARKETPLACE_NAME} <${process.env.SENDGRID_FROM_EMAIL}>`,
        replyTo: process.env.SENDGRID_REPLY_TO_EMAIL,
        subject: t('NewMessage.Subject', `{{senderName}} has sent you a new message`, { hash: { senderName: senderData.attributes.profile.displayName } }),
        html
      });

      console.log(`(${result[0]?.statusCode || 500}) Processed incoming email from ${from} to ${isFromCustomer ? providerEmail : customerEmail}`);
      return res.status(200).end();
    });
  }),
};
