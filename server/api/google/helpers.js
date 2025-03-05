const { isArrayLength } = require('../../api-util/genericHelpers');
const { google } = require('googleapis');
const { getISdk } = require('../../api-util/sdk');
const { isArray } = require('lodash');
const integrationSdk = getISdk();

// Utility function to filter calendar events based on matching event IDs
const filterEvents = (calendarEvents, events, shouldMatch) => {
  return isArrayLength(calendarEvents) && isArray(events)
    ? calendarEvents.filter(calendarEvent =>
        shouldMatch
          ? events.some(event => event?.id === calendarEvent?.eventId)
          : !events.some(event => event?.id === calendarEvent?.eventId)
      )
    : [];
};

// Utility function to update listing with remaining calendar events
const updateListingWithEvents = async (listingId, remainingEvents) => {
  return await integrationSdk.listings.update({
    id: listingId,
    privateData: {
      calendarEvents: remainingEvents,
    },
  });
};

// Function to fetch events from Google Calendar
const fetchGoogleCalendarEvents = async authClient => {
  const calendar = google.calendar({ version: 'v3', auth: authClient });
  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(startDate.getMonth() + 3);

  const eventsRes = await calendar.events.list({
    calendarId: 'primary',
    timeMin: startDate.toISOString(),
    timeMax: endDate.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });

  return eventsRes.data.items;
};

// Utility function to fetch the current user
const fetchCurrentUser = async currentUserId => {
  const { data: { data: currentUser = {} } = {} } = await integrationSdk.users.show({
    id: currentUserId,
  });
  return currentUser;
};

// Utility function to handle Google OAuth2 token
const handleGoogleOAuthToken = async (oAuth2Client, googleAuthToken, currentUserId) => {
  if (!googleAuthToken) {
    console.log('No access token; Skipping fetching real-time events');
  }

  const isTokenExpired = googleAuthToken?.expiry_date && googleAuthToken.expiry_date <= Date.now();

  if (isTokenExpired && googleAuthToken?.refresh_token) {
    try {
      oAuth2Client.setCredentials({
        refresh_token: googleAuthToken.refresh_token,
      });

      // Refresh the access token using the refresh token
      const { credentials: newToken } = await oAuth2Client.refreshAccessToken();
      // Set the new credentials to the OAuth2 client
      oAuth2Client.setCredentials(newToken);

      console.log('Google access token refreshed and updated.');

      // Update the user's profile with the new token
      await integrationSdk.users.updateProfile({
        id: currentUserId,
        privateData: {
          googleAuthToken: {
            ...googleAuthToken,
            ...newToken,
          },
        },
      });

      return {
        ...googleAuthToken,
        ...newToken,
      };
    } catch (error) {
      console.error('Error refreshing access token:', error?.data?.errors);
      throw new Error('Error refreshing Google access token');
    }
  } else {
    console.log('Google access token is valid.');
    oAuth2Client.setCredentials(googleAuthToken);
    return googleAuthToken;
  }
};

// Helper function to fetch a listing by its ID
const fetchListingById = async listingId => {
  if (!listingId) {
    throw new Error('Listing ID is required to fetch a listing');
  }

  const id = typeof listingId == 'string' ? listingId : listingId.uuid;

  try {
    const listingResponse = await integrationSdk.listings.show({ id });
    return listingResponse?.data?.data;
  } catch (error) {
    console.error(`Error fetching listing with ID ${listingId}:`, error);
    throw error;
  }
};

const getGoogleMeetingParams = async calendarResponse => {
  const calendarLink = calendarResponse?.data?.htmlLink;
  const meetingLink = calendarResponse?.data?.hangoutLink;
  const eventId = calendarResponse?.data?.id;
  const eventStartTime = calendarResponse?.data?.start?.dateTime;
  const eventEndTime = calendarResponse?.data?.end?.dateTime;
  return { calendarLink, meetingLink, eventId, eventStartTime, eventEndTime };
};

module.exports = {
  filterEvents,
  updateListingWithEvents,
  fetchGoogleCalendarEvents,
  fetchCurrentUser,
  handleGoogleOAuthToken,
  fetchListingById,
  getGoogleMeetingParams,
};
