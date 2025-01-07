// EventForm.js
import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

const randomId = () => uuidv4();

const EventForm = ({ onSubmit, onCancel }) => {
  const [title, setTitle] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [seats, setSeats] = useState(0);
  const [names, setNames] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ 
        id: randomId(),
        listingId:'',
        title, 
        start, 
        end, 
        seats, 
        protectedData: names
    
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Title:</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Start:</label>
        <input
          type="datetime-local"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          required
        />
      </div>
      <div>
        <label>End:</label>
        <input
          type="datetime-local"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          required
        />
      </div>
  
      <button type="submit">Create Event</button>
      <button type="button" onClick={onCancel}>
        Cancel
      </button>
    </form>
  );
};

export default EventForm;

/*DROPDOWN PROVIDER TOP IF CLUBJOY FETCH EVENTS WITH DETAIL FOR BREVO TEMPLATE*/
/*START E END DATE  SAME DAY E WINDOWS 15MIN*/
/* AGINGERE CAMPI NAMES E SEASTS VA IN BASE A NAMES LENGHT */
/* CREA BOOKING  SE DROPDOWN CLUBJOY*/
/* CREA ATTENDACE*/
/* MANNUAL SE CLUBJOY */
/* ALTRO COLORE OTHER PROVIDER */
/*EXTRA TEMPLATE OF CUSTOM BOOKING*/ 