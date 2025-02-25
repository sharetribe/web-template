const { integrationSdkInit } = require('../api-util/scriptManager');
const { slackProductListingsErrorWorkflow } = require('../api-util/slackHelper');
const { scriptHelper } = require('../scripts/events/notifyProductListingCreated');

const QUERY_PARAMS = { expand: true };

const filterEvents = async listingId => {
  const integrationSdk = integrationSdkInit();
  const result = await integrationSdk.listings.show(
    { id: listingId, include: ['author'] },
    QUERY_PARAMS
  );
  const resource = result?.data?.data;
  const events = [
    {
      attributes: {
        resource,
        resourceId: { uuid: listingId },
      },
    },
  ];
  return events;
};

const retryProductListingCreatedScript = async (req, res) => {
  const eventsBatchManager = scriptHelper();
  const { listingId } = req.params;
  const parsedEvents = await filterEvents(listingId);
  try {
    const [successList, failList] = await eventsBatchManager(parsedEvents);
    const withErrors = !!failList.length;
    if (withErrors) {
      slackProductListingsErrorWorkflow(failList);
    }
    const result = { success: successList.length, fail: failList.length };
    res.json({ success: true, result });
  } catch (error) {
    const failList = parsedEvents.map(event => {
      const { resourceId } = event.attributes;
      const listingId = resourceId?.uuid;
      return listingId;
    });
    slackProductListingsErrorWorkflow(failList);
    console.warn(
      `[retryProductListingCreatedScript] - Error storing the originals: ${failList.join(', ')}`
    );
    res.json({ success: false });
  }
};

module.exports = {
  retryProductListingCreatedScript,
};
