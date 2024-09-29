import CreatableSelect from 'react-select/creatable';
import { useState } from 'react';

const components = {
  DropdownIndicator: null,
};

const createOption = label => ({
  label,
  value: label,
});

export const TagInput = props => {
  const { initialValue = [], onChange = () => {} } = props;
  const initialTags = typeof initialValue === 'string' ? initialValue.split(',') : initialValue;
  const [inputValue, setInputValue] = useState('');
  const [value, setValue] = useState(initialTags.map(createOption));

  const handleKeyDown = event => {
    if (!inputValue) return;
    switch (event.key) {
      case 'Enter':
      case 'Tab':
        setValue(prev => {
          const newValue = [...prev, createOption(inputValue)];
          onChange(newValue);
          return newValue;
        });
        setInputValue('');
        event.preventDefault();
    }
  };

  return (
    <CreatableSelect
      components={components}
      inputValue={inputValue}
      isClearable
      isMulti
      menuIsOpen={false}
      onChange={newValue => setValue(newValue)}
      onInputChange={newValue => setInputValue(newValue)}
      onKeyDown={handleKeyDown}
      placeholder="Type something and press enter..."
      value={value}
    ></CreatableSelect>
  );
};
