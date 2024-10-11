import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useIntl } from 'react-intl';
import css from './Counter.module.css';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function Counter() {
  const [counter, setCounter] = useState(0);
  const intl = useIntl();

  useEffect(() => {
    const initializeCounter = async () => {
      const { data, error } = await supabase.from('counter').select('value').eq('id', 1).single();

      if (error) {
        console.error('Error fetching counter', error);
      } else {
        // setCounter(data.value);
        setCounter(101);
      }
    };

    initializeCounter();
  }, []);

  return (
    <div className={css.formContainer}>
      <h3 style={{ color: 'white' }}>
        <span className={css.counterValue}>
          {String(counter)
            .padStart(3, '0')
            .split('')
            .map((digit, index) => (
              <span key={index} className={css.digitBox}>
                {digit}
              </span>
            ))}
        </span>
      </h3>
      <div className={css.counterTitle}>{intl.formatMessage({ id: 'Counter.title' })}</div>
    </div>
  );
}

export default Counter;
