import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useIntl } from 'react-intl';
import css from './AttendaceForm.module.css';
import { PrimaryButton } from '../Button/Button';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const normalizeNames = (names) => {
  if (Array.isArray(names)) {
    return names.flat();
  }
  return [];
};

function AttendanceForm({ activity, onBack }) {

  const [checkedNames, setCheckedNames] = useState([]);
  const intl = useIntl();

  const eventIdentifier = activity?.resource?.eventIdentifier || 'unknownEvent';

  const normalizedNames = normalizeNames(activity?.names ?? []);
  const names = normalizedNames.filter((name) => !name.includes('day'));
  useEffect(() => {
    const fetchAttendanceRecords = async () => {
      if (!eventIdentifier) return;

      const { data, error } = await supabase
        .from('attendance')
        .select('name, checked_status')
        .eq('event', eventIdentifier);

      if (error) {
        console.error('Error fetching attendance records:', error);
        return;
      }

      const fetchedCheckedNames = data
        .filter((record) => record.checked_status)
        .map((record) => record.name);

      setCheckedNames([...new Set(fetchedCheckedNames)]);
    };

    fetchAttendanceRecords();
  }, [eventIdentifier]);

  const handleCheck = (name) => {
    setCheckedNames((prevState) =>
      prevState.includes(name) ? prevState.filter((n) => n !== name) : [...prevState, name],
    );
  };

  const handleSave = async () => {
    try {
      const promises = names.map(async (name) => {
        const record = {
          event: eventIdentifier,
          name,
          checked_status: checkedNames.includes(name),
        };

        // Attempt to insert or update the record
        const { data, error } = await supabase
          .from('attendance')
          .upsert(record, { onConflict: ['event', 'name'] });

        if (error) {
          throw error; // Throw the error to be caught in the catch block
        }
      });

      await Promise.all(promises);
    } catch (error) {
      console.error('Error saving records:', error.message);
    }
  };

  return (
    <div className={css.container}>
      <div className={css.formContent}>
        <h4 className={css.formTitle}>{eventIdentifier}</h4>
        <p className={css.formSubTitle}>
          Presenze: {checkedNames.length}/{names.length}
        </p>
        {names.length === 0 ? (
          <div className={css.noContainer}>
            <p>
              {intl.formatMessage({
                id: 'AttendanceForm.err',
              })}
            </p>
            <PrimaryButton className={css.button} onClick={onBack}>
              {intl.formatMessage({
                id: 'AttendanceForm.button.back',
              })}
            </PrimaryButton>
          </div>
        ) : (
          <>
            <div className={css.gridContainer}>
              {names.map((name, index) => (
                <React.Fragment key={index}>
                  <div className={css.gridItemName}>{name}</div>
                  <div className={css.gridItemCheckbox}>
                    <input
                      type="checkbox"
                      checked={checkedNames.includes(name)}
                      onChange={() => handleCheck(name)}
                    />
                  </div>
                </React.Fragment>
              ))}
            </div>
            <div className={css.buttonGroup}>
              <PrimaryButton className={css.button} onClick={handleSave}>
                {intl.formatMessage({
                  id: 'AttendanceForm.button.save',
                })}
              </PrimaryButton>
              <PrimaryButton className={css.button} onClick={onBack}>
                {intl.formatMessage({
                  id: 'AttendanceForm.button.back',
                })}
              </PrimaryButton>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AttendanceForm;
