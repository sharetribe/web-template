import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import { useIntl } from 'react-intl';
import css from './MyCalendar.module.css';
import {
  queryOwnListings,
  getOwnListingsById,
} from '../../containers/ManageListingsPage/ManageListingsPage.duck';
import { fetchCurrentUserTransactions } from '../../ducks/user.duck';
import AttendanceForm from '../AttendanceForm/AttendanceFrom';

const randomId = () => uuidv4();
const localizer = momentLocalizer(moment);

function mergeTransactionsAndBookings(response) {
  const { data: transactions, included } = response;

  // Create a map of included bookings by their ID
  const bookingMap = included.reduce((map, item) => {
    if (item.type === 'booking') {
      map[item.id.uuid] = item.attributes;
    }
    return map;
  }, {});

  // Map transactions to a simplified structure for merging
  const mergedData = transactions
    .map((transaction) => {
      const { unitType, seatNames } = transaction.attributes.protectedData;
      const listingId = transaction.relationships.listing.data.id.uuid;
      const bookingId = transaction.relationships.booking.data.id.uuid;

      // Get the corresponding booking from the map
      const booking = bookingMap[bookingId];
      if (!booking) {
        console.warn(`Booking not found for booking ID: ${bookingId}`);
        return null;
      }

      return {
        id: transaction.id.uuid,
        listingId,
        seats: booking.seats,
        start: booking.start,
        end: booking.end,
        protectedData: {
          unitType,
          seatNames,
        },
      };
    })
    .filter(Boolean);

  // Group by listing ID
  const groupedByListing = mergedData.reduce((acc, curr) => {
    const key = curr.listingId;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(curr);
    return acc;
  }, {});
  console.log('groupedByListing', groupedByListing);

  // Merge entries in each group
  const mergedByListing = Object.values(groupedByListing).map((group) => {
    if (group.length === 1) {
      const { protectedData, ...rest } = group[0];
      return {
        ...rest,
        protectedData: {
          names: protectedData.seatNames,
        },
      };
    }
    return group.reduce((merged, booking, index) => {
      if (index === 0) {
        return {
          id: booking.id,
          listingId: booking.listingId,
          seats: booking.seats,
          start: booking.start,
          end: booking.end,
          protectedData: {
            names: booking.protectedData.seatNames || [],
          },
        };
      }
      const totalSeats = merged.seats + booking.seats;
      const mergedNames = merged.protectedData.names;
      const bookingNames = booking.protectedData.seatNames || [];

      const combinedNames = [...mergedNames, ...bookingNames];
      return {
        id: `${merged.id},${booking.id}`,
        listingId: merged.listingId,
        seats: totalSeats,
        start: merged.start,
        end: merged.end,
        protectedData: {
          names: combinedNames,
        },
      };
    }, {});
  });
  console.log('mergedByListing', mergedByListing);
  return mergedByListing;
}

function MyCalendar({ ownListings, fetchOwnListings, fetchCurrentUserTransactions }) {
  const [mergedBookings, setMergedBookings] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);
  const [selectedEventDate, setSelectedEventDate] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState({ resource: null, bookingData: null });
  const [showForm, setShowForm] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(moment());
  const intl = useIntl();

  useEffect(() => {
    fetchOwnListings();
    fetchCurrentUserTransactions()
      .then((response) => {
        const mergedData = mergeTransactionsAndBookings(response);
        setMergedBookings(mergedData);
      })
      .catch((error) => {
        console.error('Error fetching user transactions:', error);
      });
  }, [fetchOwnListings, fetchCurrentUserTransactions, currentMonth]);

  // Instead of transformListingsToEvents, directly use mergedBookings as events
  const events = mergedBookings.map((booking) => {
    const listing = ownListings.find((listing) => listing.id.uuid === booking.listingId);
    return {
      id: booking.id,
      title: listing ? listing.attributes.title : 'Unknown Listing',
      start: moment(booking.start).toDate(),
      end: moment(booking.end).toDate(),
      allDay: false,
      resource: listing,
    };
  });

  const handleSelectEvent = (calendarEvent) => {
    setSelectedListing(calendarEvent.resource);
    setSelectedEventDate(calendarEvent.start);

    // Find the matched booking from mergedBookings by both listingId and start date
    const matchedBooking = mergedBookings.find((booking) => {
      const isSameDay = moment(booking.start).isSame(moment(calendarEvent.start), 'day');
      return isSameDay && booking.listingId === calendarEvent.resource.id.uuid;
    });

    if (matchedBooking) {
      const eventIdentifier = `${calendarEvent.title}-${moment(calendarEvent.start).format('YYYY-MM-DD')}`;
      setSelectedActivity({
        resource: {
          ...calendarEvent,
          eventIdentifier,
        },
        bookingData: matchedBooking, // Directly use matched booking
      });
    } else {
      setSelectedActivity({ resource: calendarEvent.resource, bookingData: null });
    }
  };

  const handleSelectActivity = () => {
    setShowForm(true);
  };

  const handleBack = () => {
    setShowForm(false);
  };

  const handleNavigate = (newDate) => {
    setCurrentMonth(moment(newDate));
  };

  return (
    <div style={{ marginTop: '180px' }}>
      {!showForm ? (
        <>
          <Calendar
            localizer={localizer}
            events={events}
            onSelectEvent={handleSelectEvent}
            onNavigate={handleNavigate}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 500, margin: '100px' }}
          />
          {selectedListing && selectedEventDate && (
            <div
              style={{
                alignItems: 'center',
                textAlign: 'center',
                marginBottom: '40px',
              }}
            >
              <h4>
                {intl.formatMessage({
                  id: 'Calendar.activity',
                })}
              </h4>
              {selectedListing.attributes.availabilityPlan.entries
                .filter((activity) => {
                  const eventDate = moment(selectedEventDate).format('YYYY-MM-DD');
                  const activityDateTime = moment(`${eventDate}T${activity.startTime}`);
                  return moment(selectedEventDate).isSame(activityDateTime, 'day');
                })
                .map((activity) => {
                  // Find the matched booking for the activity
                  const matchedBooking = mergedBookings.find((booking) => {
                    const activityDateTime = moment(
                      `${moment(selectedEventDate).format('YYYY-MM-DD')}T${activity.startTime}`,
                    );
                    return (
                      activityDateTime.isSame(moment(booking.start), 'minute') &&
                      booking.listingId === selectedListing.id.uuid
                    );
                  });

                  // If a matched booking is found, use its seats and names
                  const seatCount = matchedBooking ? matchedBooking.seats : activity.seats;
                  const seatAttendees = matchedBooking
                    ? matchedBooking.protectedData.names.length
                    : 0;
                  const names = matchedBooking ? matchedBooking.protectedData.names : [];

                  return (
                    <li
                      key={randomId()}
                      onClick={() => {
                        setSelectedActivity({
                          resource: {
                            ...activity,
                            eventIdentifier: `${selectedListing.attributes.title}-${moment(selectedEventDate).format('YYYY-MM-DD')}`,
                          },
                          bookingData: matchedBooking, // Directly pass the matched booking data here
                        });
                        handleSelectActivity();
                      }}
                      className={css.listItem}
                    >
                      {activity.startTime} {selectedListing.attributes.title}{' '}
                      {/* Seats: {selectedActivity}/{seatCount} */}
                    </li>
                  );
                })}
            </div>
          )}
        </>
      ) : (
        <AttendanceForm activity={selectedActivity} onBack={handleBack} />
      )}
    </div>
  );
}

const mapStateToProps = (state) => ({
  transactionRefs: state.InboxPage.transactionRefs,
  transactions: state.InboxPage.transactions,
  booking: state.InboxPage.booking,
  ownListings: getOwnListingsById(state, state.ManageListingsPage.currentPageResultIds),
});

const mapDispatchToProps = (dispatch) => ({
  fetchOwnListings: () => dispatch(queryOwnListings({})),
  fetchCurrentUserTransactions: () => dispatch(fetchCurrentUserTransactions()),
});

export default connect(mapStateToProps, mapDispatchToProps)(MyCalendar);
