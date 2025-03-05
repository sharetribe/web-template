const { google } = require('googleapis');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment-timezone');
const { ApiResponse } = require('../../api-util/ApiResponse');
const { asyncHandler } = require('../../api-util/asyncHandler');
const { getSdk, getISdk } = require('../../api-util/sdk');
const { getGoogleAuthToken, getUserEmail } = require('../../api-util/userDataExtractor');
const { AvailabilityException } = require('../../api-util/enums');
const { PRIMARY } = require('../../api-util/constants');

const { getListingCalendarEvents, isArrayLength } = require('../../api-util/genericHelpers');
const {
  GOOGLE_CALENDAR_EVENT_SCOPE,
  REACT_APP_MARKETPLACE_ROOT_URL,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
} = process.env;

// Guess the user's timezone
const guessedTimezone = moment.tz.guess();

const SCOPES = [GOOGLE_CALENDAR_EVENT_SCOPE];

const {
  filterEvents,
  fetchGoogleCalendarEvents,
  updateListingWithEvents,
  fetchCurrentUser,
  handleGoogleOAuthToken,
  fetchListingById,
  getGoogleMeetingParams,
} = require('./helpers');
const { isArray } = require('lodash');
const { getDateTimeForDay, formatTime } = require('../../api-util/googleCalendarHelpers');

const oAuth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  `${REACT_APP_MARKETPLACE_ROOT_URL}/account/google/auth`
);
const { UNAVAILABLE } = AvailabilityException;

const integrationSdk = getISdk();

const generateAuthUrl = asyncHandler(async (req, res) => {
  try {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent',
      include_granted_scopes: true,
    });

    res.status(200).json(new ApiResponse(200, authUrl, 'Visit this url for authentication'));
  } catch (error) {
    res.status(500).json(new ApiResponse(500, {}, 'Error while creating an auth url'));
  }
});

const revokeGoogleAuthToken = asyncHandler(async (req, res) => {
  const sdk = getSdk(req, res);

  try {
    // Fetch current user data
    const { data: { data: currentUser = {} } = {} } = await sdk.currentUser.show({});
    const googleAuthToken = getGoogleAuthToken(currentUser);

    // If no token exists, return early
    if (!googleAuthToken?.access_token) {
      return res.status(400).json(new ApiResponse(400, {}, 'No Google token found to revoke.'));
    }

    // Revoke the Google token
    const oAuth2Client = new google.auth.OAuth2();
    oAuth2Client.setCredentials({ access_token: googleAuthToken.access_token });

    await oAuth2Client.revokeToken(googleAuthToken.access_token);

    // Clear the token from the user profile
    await sdk.currentUser.updateProfile({
      privateData: {
        googleAuthToken: null,
      },
    });

    return res.status(200).json(new ApiResponse(200, {}, 'Token revoked successfully.'));
  } catch (error) {
    console.error('Error revoking Google token:', error);

    // Ensure token is cleared even in case of error
    await sdk.currentUser.updateProfile({
      privateData: {
        googleAuthToken: null,
      },
    });

    return res.status(500).json(new ApiResponse(500, {}, 'Error while revoking token'));
  }
});

const saveAuthToken = asyncHandler(async (req, res) => {
  const sdk = getSdk(req, res);
  const { code, listingId } = req.query;

  try {
    if (code) {
      const { tokens } = await oAuth2Client.getToken(code);
      oAuth2Client.setCredentials(tokens);

      await sdk.currentUser.updateProfile({
        privateData: {
          googleAuthToken: tokens,
        },
      });
      if (listingId) {
        // Fetch events from the Google Calendar
        const events = await fetchGoogleCalendarEvents(oAuth2Client);

        // Call the function to add availability
        await syncCalendarEventsAndAvailability(events, listingId);
      }
    }
    res
      .status(200)
      .json(new ApiResponse(200, {}, 'Authentication successful and availability processed'));
  } catch (error) {
    console.error('Error while processing authentication:', error);
    res.status(500).json(new ApiResponse(500, {}, 'Error while creating an auth url'));
  }
});

const deleteGoogleEvent = async ({ exceptionId, currentUserId, listingId }) => {
  const currentUser = await fetchCurrentUser(currentUserId)
  const googleAuthToken = getGoogleAuthToken(currentUser)
  await handleGoogleOAuthToken(oAuth2Client, googleAuthToken, currentUserId)

  const listing = await fetchListingById(listingId)
  let calendarEvents = getListingCalendarEvents(listing)

  const calendar = google.calendar({ version: 'v3', auth: oAuth2Client })

  const eventId =
    isArray(calendarEvents) && calendarEvents?.find(e => e.exceptionId === exceptionId)?.eventId

  try {
    // Make the API call to delete the event by eventId
    const deleteEvents =
      eventId &&
      (await calendar.events.delete({
        calendarId: 'primary', // TODO: Make calendar selection configurable
        eventId: eventId,
      }))

    const updatedEvents =
      isArray(calendarEvents) && calendarEvents.filter(e => e.eventId !== eventId)

    deleteEvents && (await updateListingWithEvents(listingId, updatedEvents))

    return {
      success: true,
      message: `Event with ID ${eventId} deleted successfully`
    }
  } catch (error) {
    console.error('Error deleting Google Calendar event:', error)
    throw new Error('Failed to delete Google Calendar event')
  }
}

const deleteGoogleEventByID = asyncHandler(async (req, res) => {
  const { exceptionId, currentUserId, listingId } = req.body
  try {
    const result = await deleteGoogleEvent({ exceptionId, currentUserId, listingId })
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: error.message
    })
  }
})

const createGoogleMeeting = async ({ txId, startDateTimeOverride, endDateTimeOverride }) => {
  const response = await integrationSdk.transactions.show({
    id: txId,
    include: ['booking', 'customer', 'provider', 'listing'],
  })

  const relationships = response?.data?.data?.relationships

  const [
    { data: { data: provider = {} } = {} },
    { data: { data: customer = {} } = {} },
  ] = await Promise.all([
    integrationSdk.users.show({ id: relationships?.provider?.data?.id?.uuid }),
    integrationSdk.users.show({ id: relationships?.customer?.data?.id?.uuid }),
  ])

  const booking =
    isArrayLength(response?.data?.included) &&
    response?.data?.included.find(i => i.type === 'booking')

  const listing =
    isArrayLength(response?.data?.included) &&
    response?.data?.included.find(i => i.type === 'listing')

  const currentUserEmail = getUserEmail(customer)
  const authorEmail = getUserEmail(provider)

  // Convert start and end times to Date objects for the specified day
  const startDateTime = moment(startDateTimeOverride || booking?.attributes?.start).toISOString()
  const endDateTime = moment(endDateTimeOverride || booking?.attributes?.end).toISOString()

  const googleAuthToken = getGoogleAuthToken(provider)
  await handleGoogleOAuthToken(
    oAuth2Client,
    googleAuthToken,
    relationships?.provider?.data?.id?.uuid
  )

  const calendar = google.calendar({
    version: 'v3',
    auth: oAuth2Client,
  })

  // Create an event object with optional conference data for Google Meet
  const event = {
    summary: `Meeting for ${listing?.attributes?.title}`,
    description: UNAVAILABLE,
    start: {
      dateTime: startDateTime,
      timeZone: guessedTimezone || 'America/Los_Angeles',
    },
    end: {
      dateTime: endDateTime,
      timeZone: guessedTimezone || 'America/Los_Angeles',
    },
    attendees: [currentUserEmail, authorEmail].map(email => ({ email })),
    conferenceData: {
      createRequest: {
        requestId: `meet-${txId}`, // Unique request ID for the meeting
        conferenceSolutionKey: {
          type: 'hangoutsMeet',
        },
        status: { statusCode: 'success' },
      },
    },
  }

  const calendarResponse = await calendar.events.insert({
    calendarId: PRIMARY,
    resource: event,
    conferenceDataVersion: 1, // Include conference data if isMeeting is true
  })

  const calendarMeetingParams = await getGoogleMeetingParams(calendarResponse)

  await integrationSdk.transactions.updateMetadata({
    id: txId,
    metadata: {
      googleCalendarEventDetails: {
        ...calendarMeetingParams,
      },
    },
  })

  return calendarMeetingParams
}

const createGoogleMeetingHandler = asyncHandler(async (req, res) => {
  try {
    const { txId } = req.body
    const meeting = await createGoogleMeeting({ txId })
    return res.status(200).json(new ApiResponse(200, { meeting }, 'Google meeting created successfully'))
  } catch (error) {
    return console.log(error, `Error while creating google meeting!');`)
  }
})

const fetchGoogleEventsRealtime = asyncHandler(async (req, res) => {
  const {
    listingId,
    currentUserId,
    availabilityException = null,
    weeklyAvailability = null,
  } = req.body;

  try {
    const currentUser = await fetchCurrentUser(currentUserId);
    const googleAuthToken = getGoogleAuthToken(currentUser);

    if (!googleAuthToken) {
      return res.status(200).json(new ApiResponse(200, {}, 'No google token found.'));
    }

    await handleGoogleOAuthToken(oAuth2Client, googleAuthToken, currentUserId);

    if (availabilityException && googleAuthToken) {
      // Call the separate function to add the availability exception to the calendar
      await addAvailabilityExceptionToCalendar(oAuth2Client, listingId, availabilityException);
    } else if (isArrayLength(weeklyAvailability)) {
      // Assume you have the OAuth2 client and the weeklyAvailability array already available
      addRecurringEventToGoogleCalendar(oAuth2Client, weeklyAvailability, listingId);
    } else {
      // You can now proceed to fetch Google Calendar events using the updated oAuth2Client
      const events = await fetchGoogleCalendarEvents(oAuth2Client);

      // Call the function to add availability
      await syncCalendarEventsAndAvailability(events, listingId);
    }

    return res
      .status(200)
      .json(new ApiResponse(200, {}, 'Google token checked and updated if needed.'));
  } catch (error) {
    return console.log(
      error,
      `Error while refreshing token and fetching real time availabilities');`
    );
  }
});

const addRecurringEventToGoogleCalendar = async (oAuth2Client, weeklyAvailability, listingId) => {
  const calendar = google.calendar({
    version: 'v3',
    auth: oAuth2Client,
  });

  const listing = await fetchListingById(listingId);
  let calendarEvents = getListingCalendarEvents(listing);

  try {
    for (const availability of weeklyAvailability) {
      const { dayOfWeek, startTime, endTime, timezone } = availability;

      // Convert start and end times to Date objects for the specified day
      const startDateTime = getDateTimeForDay(dayOfWeek, startTime);
      const endDateTime = getDateTimeForDay(dayOfWeek, endTime);

      // Ensure that the end time is after the start time
      if (endDateTime <= startDateTime) {
        console.error(`Invalid time range: ${startTime} - ${endTime} on ${dayOfWeek}`);
        throw new Error(`Invalid time range for ${dayOfWeek}: end time must be after start time.`);
      }

      const startDateTimeISO = new Date(startDateTime).toISOString();
      const endDateTimeISO = new Date(endDateTime).toISOString();
      // Calendar day of the week mapping (e.g., "MO" for Monday)
      const dayOfWeekMap = {
        sun: 'SU',
        mon: 'MO',
        tue: 'TU',
        wed: 'WE',
        thu: 'TH',
        fri: 'FR',
        sat: 'SA',
      };

      // Fetch existing events from the calendar
      const eventList = await calendar.events.list({
        calendarId: 'primary',
      });
      const existingEvents =
        isArrayLength(eventList.data.items) &&
        eventList.data.items.map(event => ({
          start: formatTime(new Date(event?.start?.dateTime)),
          end: formatTime(new Date(event?.end?.dateTime)),
        }));

      // Format the start and end times to HH:mm
      const formattedStartTime = formatTime(startDateTime);
      const formattedEndTime = formatTime(endDateTime);

      // Check if this entry already exists in the calendar
      const eventExists = existingEvents.some(
        event => event.start === formattedStartTime && event.end === formattedEndTime
      );

      if (eventExists) {
        console.log(`Event for ${dayOfWeek} at ${startTime}-${endTime} already exists.`);
        continue;
      }

      // Create the event object for recurring event
      const event = {
        summary: 'Weekly Availability',
        description: 'Recurring weekly availability.',
        start: {
          dateTime: startDateTimeISO,
          timeZone: timezone,
        },
        end: {
          dateTime: endDateTimeISO,
          timeZone: timezone,
        },
        recurrence: [`RRULE:FREQ=WEEKLY;BYDAY=${dayOfWeekMap[dayOfWeek.toLowerCase()]}`],
      };

      // Insert the event into Google Calendar
      const response = await calendar.events.insert({
        auth: oAuth2Client,
        calendarId: 'primary', // Replace with your calendar ID if necessary
        resource: event,
      });

      calendarEvents.push({
        eventId: response?.data?.id,
        exceptionId: uuidv4(),
      });

      console.log(`Recurring event created for ${dayOfWeek}: ${response.data.id}`);
      await updateListingWithEvents(listingId, calendarEvents);
    }
  } catch (error) {
    console.error('Error creating recurring event:', error);
    throw new Error('Failed to create recurring event');
  }
};

const addAvailabilityExceptionToCalendar = async (
  oAuth2Client,
  listingId,
  availabilityException
) => {
  try {
    const {
      attributes: { start, end },
      id: availabilityExceptionId,
    } = availabilityException;

    const listing = await fetchListingById(listingId);
    let calendarEvents = getListingCalendarEvents(listing);

    const calendar = google.calendar({
      version: 'v3',
      auth: oAuth2Client,
    });

    // Format start and end times to ISO strings
    const startISO = new Date(start).toISOString();
    const endISO = new Date(end).toISOString();

    // Create an event object
    const event = {
      summary: 'Availability Exception',
      description: 'This time slot is not available.',
      start: {
        dateTime: startISO,
        timeZone: 'America/Los_Angeles', // Adjust this based on your needs
      },
      end: {
        dateTime: endISO,
        timeZone: 'America/Los_Angeles', // Adjust this based on your needs
      },
      attendees: [], // Optional: you can add attendees here
      extendedProperties: {
        private: {
          availabilityExceptionId: availabilityExceptionId?.uuid,
        },
      },
    };

    // Insert the event into Google Calendar
    const response = await calendar.events.insert({
      calendarId: 'primary', // Replace with your calendar ID if needed
      resource: event,
      conferenceDataVersion: 0, // Set to 1 if including conference data like Google Meet
    });

    calendarEvents.push({
      eventId: response?.data?.id,
      exceptionId: availabilityExceptionId?.uuid,
    });

    await updateListingWithEvents(listingId, calendarEvents);
    return response.data;
  } catch (error) {
    console.error('Error creating availability exception event:', error);
    throw new Error('Error creating availability exception event');
  }
};

const rescheduleEvent = async ({ txId, startDateTimeOverride, endDateTimeOverride }) => {
  if (!txId) throw new Error('No transaction ID provided')

  console.log('Rescheduling Google event for transaction', txId)

  const transaction = await integrationSdk.transactions.show({
    id: txId,
    include: ['listing', 'customer', 'provider', 'booking'],
  })

  if (!transaction?.status === 200) throw new Error('Error rescheduling Google event')
  const { data: transactionData } = transaction.data

  const eventId = transactionData?.attributes?.metadata?.googleCalendarEventDetails?.eventId
  if (!eventId) throw new Error('No eventId found for Google event')

  const listing = transaction?.data?.included?.find(i => i.type === 'listing')
  let calendarEvents = getListingCalendarEvents(listing)

  const exceptionId = calendarEvents?.find(e => e.eventId === eventId)?.exceptionId
  const currentUserId = transactionData?.relationships?.provider?.data?.id?.uuid
  const listingId = listing.id.uuid

  await deleteGoogleEvent({ exceptionId, currentUserId, listingId })
  const events = await fetchGoogleCalendarEvents(oAuth2Client)
  await syncCalendarEventsAndAvailability(events, listingId)
  const meeting = await createGoogleMeeting({ txId, startDateTimeOverride, endDateTimeOverride })
  await syncCalendarEventsAndAvailability(events, listingId)

  return meeting
}

const rescheduleEventHandler = asyncHandler(async (req, res) => {
  const { txId, startDateTimeOverride, endDateTimeOverride } = req.body
  const meeting = await rescheduleEvent({ txId, startDateTimeOverride, endDateTimeOverride })
  return res.status(200).json(new ApiResponse(200, { meeting }, 'Google event rescheduled successfully'))
})

const cancelEvent = asyncHandler(async (req, res) => {
  const sdk = getSdk(req, res)
  const { txId } = req.body;
  const transaction = await integrationSdk.transactions.show({
    id: txId,
    include: ['listing', 'customer', 'provider', 'booking'],
  });

  if (!transaction?.status === 200) throw new Error('Error cancelling Google event');
  const { data: transactionData } = transaction.data;

  const currentUser = await sdk.currentUser.show({})
  if (!currentUser?.status === 200) throw new Error('Error fetching current user');
  const { data: currentUserData } = currentUser.data;
  const currentUserId = currentUserData?.id?.uuid
  const providerId = transactionData?.relationships?.provider?.data?.id?.uuid
  if (currentUserId !== providerId) throw new Error('Current user is not the provider');

  const eventId = transactionData?.attributes?.metadata?.googleCalendarEventDetails?.eventId;
  if (!eventId) return res.status(200).json(new ApiResponse(200, {}, 'No Google event found; skipping cancellation'));

  const listing = transaction?.data?.included?.find(i => i.type === 'listing');
  const listingId = listing.id.uuid
  let calendarEvents = getListingCalendarEvents(listing);

  const exceptionId = calendarEvents?.find(e => e.eventId === eventId)?.exceptionId;
  if (!exceptionId) return res.status(200).json(new ApiResponse(200, {}, 'No Google event found; skipping cancellation'));

  await deleteGoogleEvent({ exceptionId, currentUserId, listingId });
  const events = await fetchGoogleCalendarEvents(oAuth2Client);
  await syncCalendarEventsAndAvailability(events, listingId);

  return res.status(200).json(new ApiResponse(200, {}, 'Google event cancelled successfully'));
});

// Main function to add availability
const syncCalendarEventsAndAvailability = async (events, listingId) => {
  const listing = await fetchListingById(listingId);
  let calendarEvents = getListingCalendarEvents(listing);

  const filteredEvents = filterEvents(calendarEvents, events, false);
  const remainingEvents = filterEvents(calendarEvents, events, true);

  if (isArrayLength(filteredEvents)) {
    await deleteAvailabilityExceptions(filteredEvents);
    await updateListingWithEvents(listingId, remainingEvents);
  }

  for (const event of events) {
    try {
      const {
        start: { dateTime: startDateTime },
        end: { dateTime: endDateTime },
      } = event;

      // Convert to Date objects
      const start = new Date(startDateTime);
      const end = new Date(endDateTime);
      const exceptionParams = {
        listingId: listingId,
        start,
        end,
        seats: 0,
      };

      const response = await integrationSdk.availabilityExceptions.create(exceptionParams);
      const exceptionId = response?.data?.data?.id?.uuid;
      const eventId = event?.id;

      calendarEvents.push({
        eventId,
        exceptionId,
      });

      console.log('Updated listing with calendar events!');
      await updateListingWithEvents(listingId, calendarEvents);
    } catch (error) {
      console.error('Event already exists!');
    }
  }
};

const deleteAvailabilityExceptions = async existingEvents => {
  try {
    // Create an array of promises for deleting each availability exception
    const deletePromises = existingEvents.map(async eventToDelete => {
      try {
        await integrationSdk.availabilityExceptions.delete({ id: eventToDelete.exceptionId });
        console.log(`Removed availability exception with ID: ${eventToDelete.exceptionId}`);
      } catch (deleteError) {
        console.error(
          `Failed to delete exception with ID: ${eventToDelete.exceptionId}`,
          deleteError
        );
      }
    });

    // Wait for all deletion promises to complete
    return await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error during deletion of availability exceptions');
  }
};

module.exports = {
  generateAuthUrl,
  saveAuthToken,
  deleteGoogleEvent,
  deleteGoogleEventByID,
  revokeGoogleAuthToken,
  createGoogleMeeting,
  createGoogleMeetingHandler,
  fetchGoogleEventsRealtime,
  rescheduleEvent,
  rescheduleEventHandler,
  cancelEvent,
};
