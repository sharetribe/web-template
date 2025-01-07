import { useEffect, useState } from 'react';
import { Field } from 'react-final-form';

function OnChangeState(props) {
  const {
    input: { value },
    children,
  } = props;

  const [previousValue, setPreviousValue] = useState(value);

  useEffect(() => {
    if (value !== previousValue) {
      setPreviousValue(value);
      children(value, previousValue);
    }
  }, [value, previousValue, children]);

  return null;
}

const OnChange = ({ name, children }) => (
  <Field
    name={name}
    subscription={{ value: true }}
    allowNull
    render={props => <OnChangeState {...props}>{children}</OnChangeState>}
  />
);

export default OnChange;
