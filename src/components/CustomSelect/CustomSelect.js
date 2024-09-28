import Select from 'react-select';

export const CustomSelect = props => {
  const { options, defaultValue, name, onChange, isMulti } = props;

  return (
    <Select
      className="custom-select"
      classNamePrefix="select"
      onChange={onChange}
      defaultValue={defaultValue}
      name={name}
      options={options}
      isMulti={isMulti}
    ></Select>
  );
};
