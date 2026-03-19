const { handleError } = require('../../api-util/sdk');
const { videoConferenceServices, sharetribeServices } = require('../../services');
const { denormalisedResponseEntities } = require('../../api-util/data');

const createRoom = async (req, res) => {
  try {
    const { txID } = req.body;

    const txRes = await sharetribeServices.getTransaction(txID, {
      include: ['customer', 'provider', 'listing', 'booking'],
    });
    const tx = denormalisedResponseEntities(txRes)[0];

    if (!tx?.id?.uuid) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const { customer, provider } = tx;
    const txRole =
      customer.id.uuid === req.tokenUserId
        ? 'customer'
        : provider.id.uuid === req.tokenUserId
        ? 'provider'
        : null;

    if (!txRole) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Before creating a new room, check if another transaction for the same
    // listing and booking time already has a room set up.
    const bookingStart = tx.booking?.attributes?.start;
    const bookingEnd = tx.booking?.attributes?.end;
    const listingId = tx.listing?.id?.uuid;

    if (bookingStart && bookingEnd && listingId) {
      const startISO = new Date(bookingStart).toISOString();
      const endISO = new Date(bookingEnd).toISOString();
      const existingTxsRes = await sharetribeServices.queryTransactions({
        bookingStates: 'accepted',
        listingId,
        bookingStart: `${startISO},`,
        bookingEnd: `${endISO},`,
        include: ['booking'],
      });
      const existingTxs = denormalisedResponseEntities(existingTxsRes);

      const matchingTx = existingTxs.find(t => {
        if (t.id.uuid === txID) return false;
        const tStart = t.booking?.attributes?.start;
        const tEnd = t.booking?.attributes?.end;
        return (
          tStart &&
          tEnd &&
          new Date(tStart).getTime() === new Date(bookingStart).getTime() &&
          new Date(tEnd).getTime() === new Date(bookingEnd).getTime() &&
          t.attributes?.metadata?.roomId
        );
      });

      if (matchingTx) {
        const { providerCode, roomId } = matchingTx.attributes.metadata;
        const result = await videoConferenceServices.joinRoom(txID, roomId, providerCode);
        return res.status(200).json(result);
      }
    }

    const result = await videoConferenceServices.setupRoom(txID, tx.listing.attributes.title);
    res.status(200).json(result);
  } catch (error) {
    console.log(error, 'Error creating room!!');
    handleError(res, error);
  }
};

module.exports = createRoom;
