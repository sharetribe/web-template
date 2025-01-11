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
import EventForm from '../EventForm/EventForm';

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

  // Map transactions to a simplified structure for each booking
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
  
  // Group by listing ID and start date to merge bookings with the same start date for each listing
  const groupedByListingDateAndTime = Object.values(
    mergedData.reduce((acc, curr) => {
      const listingKey = curr.listingId;
      const startDateTimeKey = moment(curr.start).format('YYYY-MM-DDTHH:mm');
  
      const key = `${listingKey}-${startDateTimeKey}`;
  
      if (!acc[key]) {
        acc[key] = {
          id: curr.id,
          listingId: curr.listingId,
          seats: curr.seats,
          start: curr.start,
          end: curr.end,
          protectedData: {
            names: [...(curr.protectedData.seatNames || [])],
          },
        };
      } else {
        // Merge the seats and names if multiple bookings at the same start time for the same listing
        acc[key].seats += curr.seats;
        acc[key].protectedData.names.push(...(curr.protectedData.seatNames || []));
      }
  
      return acc;
    }, {}),
  );

  return groupedByListingDateAndTime;
}

function MyCalendar({ ownListings, fetchOwnListings, fetchCurrentUserTransactions }) {
  const [mergedBookings, setMergedBookings] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);
  const [selectedEventDate, setSelectedEventDate] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState({ resource: null, bookingData: null });
  const [showForm, setShowForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [calendarEvent, setCalendarEvent] = useState(null);
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

  // Map mergedBookings to events to ensure only one event per date per listing
  const events = mergedBookings.map((booking) => {
    const listing = ownListings.find((listing) => listing.id.uuid === booking.listingId);
    
    // Check if protectedData exists and has names
    const names = booking.protectedData ? booking.protectedData.names : 'No Names Available';
  
    return {
      id: booking.id,
      title: listing ? `${listing.attributes.title} - ${moment(booking.start).format('HH:mm')}` : `Manuale ${booking.title} - ${moment(booking.start).format('HH:mm')}`,
      start: moment(booking.start).toDate(),
      end: moment(booking.end).toDate(),
      allDay: false,
      resource: listing,
      seats: booking.seats,
      names: names,
    };
  });

  const handleSelectEvent = (calendarEvent) => {
    setSelectedListing(calendarEvent.resource);
    setSelectedEventDate(calendarEvent.start);
    setCalendarEvent(calendarEvent);
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

  const handleCreateEvent = (eventData) => {
    setMergedBookings([...mergedBookings, eventData]);
    setShowEventForm(false);
  };

  return (
    <div style={{ marginTop: '180px' }}>
      {!showForm && !showEventForm ? (
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
          <button onClick={() => setShowEventForm(true)}>Create Event</button>
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
              <ul>
                {selectedActivity && (
                  <li
                    key={randomId()}
                    onClick={handleSelectActivity}
                    className={css.listItem}
                  >
                    {moment(selectedEventDate).format('HH:mm')} {selectedListing.attributes.title}
                    {/* Seats: {selectedActivity.bookingData.names.length}/{selectedActivity.bookingData.seats} */}
                  </li>
                )}
              </ul>
            </div>
          )}
        </>
      ) : showEventForm ? (
      
        null
      ) : (
        <AttendanceForm activity={calendarEvent} onBack={handleBack} />
      )}
    </div>
  );
}
{ /*<EventForm
  onSubmit={handleCreateEvent}
  onCancel={() => setShowEventForm(false)}
/>*/}
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
