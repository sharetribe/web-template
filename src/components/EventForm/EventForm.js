import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "./react-datepicker.css";
import css from "./EventForm.module.css";
import { createClient } from '@supabase/supabase-js';
import { manualEvent } from "../../util/api";
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

import { v4 as uuidv4 } from 'uuid';


const randomId = () => uuidv4();

const EventForm = ({ onSubmit, onCancel, currentUser }) => {

  const [provider, setProvider] = useState('Clubjoy');
  const [title, setTitle] = useState('');
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [names, setNames] = useState([]);
  const [listingId, setListingId] = useState('n/a');

  const handleProviderChange = (e) => {
    const selectedProvider = e.target.value;
    setProvider(selectedProvider);
    if (selectedProvider === 'Clubjoy') {
      console.log('Fetching possible titles for Clubjoy...');
      setTitle('Suggested Clubjoy Title');
    } else {
      setTitle(''); // Clear title for other providers
    }
  };

  const handleStartChange = (date) => {
    setStart(date);
    setEnd(null); // Reset end date when start date changes
  };

  const handleEndChange = (date) => {
    if (start && date.toDateString() !== start.toDateString()) {
      console.log('End date must be the same as start date.');
      return;
    }
    if (start && date <= start) {
      ('End time cannot be before start time.');
      return;
    }
    setEnd(date);
  };

  const handleNameChange = (e) => {
    const nameList = e.target.value.split(',').map((name) => name.trim());
    setNames(nameList);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const newEvent = {
      id: randomId(),
      listing_id: listingId,
      title,
      start: start.toISOString(),
      end: end.toISOString(),
      seats: names.length,
      protectedData: { names },
      userId: currentUser?.id?.uuid,
      provider,
    };
  
    const { data, error } = await supabase
      .from('reservations')
      .insert([newEvent]);
  
    if (error) { // Changed 'err' to 'error' to match the destructured variable
      console.error('Error inserting data:', error.message);
    } 
  
    const payload = {
      newEvent,
      email: currentUser.attributes.email,
    };
  
    await manualEvent(payload)
      .then((response) => {
        console.log('Event created:', response);
        onCancel();
      })
      .catch((error) => {
        console.error('Error creating event:', error);
      }); // Closed the 'catch' block properly
  };
  

  return (
    <form className={css.container} onSubmit={handleSubmit}>
      <div>
        <label>Provider:</label>
        {/* onChange={handleProviderChange}*/}
        <select value={provider}>
          <option value="Clubjoy">Clubjoy</option>
          <option value="AirBnb">AirBnb</option>
          <option value="GetYourGuide">GetYourGuide</option>
          <option value="Viator">Viator</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div>
        <label>Title:</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        //disabled={provider === 'Clubjoy'}
        />
      </div>
      <div>
        <label>Booking number (if any):</label>
        <input
          type="text"
          value={listingId}
          onChange={(e) => setListingId(e.target.value)}
        //disabled={provider === 'Clubjoy'}
        />
  
      <div className={css.datePickerContainer}>
  <label>Start:</label>
  <DatePicker
    selected={start}
    onChange={handleStartChange}
    showTimeSelect
    timeFormat="HH:mm"
    timeIntervals={15} // 15-minute intervals
    dateFormat="MMMM d, yyyy h:mm aa"
    placeholderText="Select start date and time"
  />
</div>
<div className={css.datePickerContainer}>
  <label>End:</label>
  <DatePicker
    selected={end}
    onChange={handleEndChange}
    showTimeSelect
    timeFormat="HH:mm"
    timeIntervals={15} // 15-minute intervals
    dateFormat="MMMM d, yyyy h:mm aa"
    placeholderText="Select end date and time"
    minDate={start} // Ensure end date is not before start date
    disabled={!start} // Disable until start is selected
  />
</div>


      </div>
      <div>
        <label>Names (comma-separated):</label>
        <input
          type="text"
          onChange={handleNameChange}
          placeholder="Enter names separated by commas"
        />
        <p>Seats: {names.length}</p>
      </div>
      <button className={css.button} type="submit">Create Event</button>
      <button className={css.button} type="button" onClick={onCancel}>
        Cancel
      </button>
    </form>
  );
};

export default EventForm;




/* DROPDOWN PROVIDER TOP IF CLUBJOY FETCH EVENTS WITH DETAIL FOR BREVO TEMPLATE*/

/* CREA BOOKING  SE DROPDOWN CLUBJOY*/
/* CREA ATTENDACE*/
/* MANNUAL SE CLUBJOY */
/* ALTRO COLORE OTHER PROVIDER */
/*EXTRA TEMPLATE OF CUSTOM BOOKING*/ 