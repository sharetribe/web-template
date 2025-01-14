import React, { useState } from "react";
import DatePicker from "react-datepicker";

import { v4 as uuidv4 } from 'uuid';

const randomId = () => uuidv4();

const EventForm = ({ onSubmit, onCancel }) => {
  const [provider, setProvider] = useState('Clubjoy');
  const [title, setTitle] = useState('');
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [names, setNames] = useState([]);

  const handleProviderChange = (e) => {
    const selectedProvider = e.target.value;
    setProvider(selectedProvider);
    if (selectedProvider === 'Clubjoy') {
      console.log('Fetching possible titles for Clubjoy...');
      // Simulate fetch logic
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
      console.log('End time cannot be before start time.');
      return;
    }
    setEnd(date);
  };

  const handleNameChange = (e) => {
    const nameList = e.target.value.split(',').map((name) => name.trim());
    setNames(nameList);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (provider === 'Clubjoy') {
      console.log('Calling API for Clubjoy event creation...');
    }
    onSubmit({
      id: randomId(),
      listingId: '',
      title,
      start,
      end,
      seats: names.length, // Number of seats equals the number of names
      protectedData: names
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Provider:</label>
        <select value={provider} onChange={handleProviderChange}>
          <option value="Clubjoy">Clubjoy</option>
          <option value="AirBnb">AirBnb</option>
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
          disabled={provider === 'Clubjoy'}
        />
      </div>
      <div>
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
      <div>
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
          filterDate={(date) => start && date.toDateString() === start.toDateString()}
          filterTime={(time) => !start || time >= start} // Ensure time is not before start time
          disabled={!start} // Disable until start is selected
        />


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
      <button type="submit">Create Event</button>
      <button type="button" onClick={onCancel}>
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