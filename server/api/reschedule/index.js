const fs = require('fs');
const formidable = require('formidable');
const handlebars = require('handlebars');
const path = require('path');
const { v4: uuid } = require('uuid');

const { asyncHandler } = require('../../api-util/asyncHandler');
const { getISdk, getSdk } = require('../../api-util/sdk');
const { rescheduleEvent } = require('../google/google.calendar');
const isdk = getISdk();

const mail = require('@sendgrid/mail');
mail.setApiKey(process.env.SENDGRID_API_KEY);
const { t } = require('../../api-util/emailHelpers');

const rescheduleRequest = asyncHandler(async (req, res) => {
  const { txId, start, end } = req.body;

  const transactionResult = await isdk.transactions.show({ id: txId, include: ['booking', 'provider'] });
  if (transactionResult.status !== 200) return res.status(transactionResult.status).json({ error: transactionResult.data });

  const transaction = transactionResult.data;
  const request = transaction.data.attributes.metadata.rescheduleRequest;
  const provider = transaction.included.find(item => item.type === 'user');

  if (request) return res.status(400).json({ error: 'Reschedule request already exists' });
  const rescheduleRequest = {
    submitted: new Date().toISOString(),
    start: start.toISOString(),
    end: end.toISOString(),
    key: uuid(),
  };

  try {
    await isdk.transactions.updateMetadata({
      id: txId,
      metadata: { rescheduleRequest },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }

  try {
    const booking = transaction.included.find(item => item.type === 'booking');
    const template = handlebars.compile(fs.readFileSync(path.join(__dirname, '../../templates/reschedule-request.html'), 'utf8').toString());
    const html = template({
      message: {
        transaction: { id: txId },
        originalBooking: { start: booking.attributes.start, end: booking.attributes.end },
        newBooking: { start, end },
        marketplace: {
          name: process.env.REACT_APP_MARKETPLACE_NAME,
          url: process.env.REACT_APP_MARKETPLACE_ROOT_URL
        }
      },
    });

    await mail.send({
      to: provider.attributes.email,
      from: `${process.env.SENDGRID_FROM_EMAIL}`,
      subject: t('RescheduleRequest.Subject', 'Reschedule request submitted'),
      html,
    });
  } catch (error) {
    console.error(error);
  }

  res.json({ transaction, start, end, rescheduleRequest });
});

const acceptRescheduleRequest = asyncHandler(async (req, res) => {
  const { txId } = req.body;

  try {
    const transactionResult = await isdk.transactions.show({ id: txId, include: ['customer'] });
    if (transactionResult.status !== 200) return res.status(transactionResult.status).json({ error: transactionResult.data });

    const transaction = transactionResult.data;
    const request = transaction.data.attributes.metadata.rescheduleRequest;
    const customer = transaction.included.find(item => item.type === 'user');

    const result = await isdk.transactions.transition({
      id: txId,
      params: { bookingStart: request.start, bookingEnd: request.end },
      transition: 'transition/customer-reschedule',
    });

    if (result.status !== 200) return res.status(result.status).json({ error: result.data });

    await isdk.transactions.updateMetadata({
      id: txId,
      metadata: { rescheduleRequest: null },
    });

    if (transaction?.data?.attributes?.metadata?.googleCalendarEventDetails) {
      try {
        await rescheduleEvent({ txId: txId, startDateTimeOverride: request.start, endDateTimeOverride: request.end });
      } catch (error) {
        console.error('Error rescheduling Google Calendar event (provider:accept)', error);
      }
    }

    try {
      const booking = transaction.included.find(item => item.type === 'booking');
      const template = handlebars.compile(fs.readFileSync(path.join(__dirname, '../../templates/reschedule-request-accepted.html'), 'utf8').toString());
      const html = template({
        message: {
          transaction: { id: txId },
          originalBooking: { start: booking.attributes.start, end: booking.attributes.end },
          newBooking: { start: request.start, end: request.end },
          marketplace: {
            name: process.env.REACT_APP_MARKETPLACE_NAME,
            url: process.env.REACT_APP_MARKETPLACE_ROOT_URL
          }
        },
      });

      await mail.send({
        to: customer.attributes.email,
        from: `${process.env.SENDGRID_FROM_EMAIL}`,
        subject: t('RescheduleRequestApproved.Subject', 'Reschedule request approved'),
        html,
      });
    } catch (error) {
      console.error('Error sending reschedule request accepted email', error);
    }

    res.json({ transaction, request, result });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = {
  rescheduleRequest,
  acceptRescheduleRequest,
};
