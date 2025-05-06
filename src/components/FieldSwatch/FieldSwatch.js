import React from 'react';
import classNames from 'classnames';
import { Field } from 'react-final-form';

import multicolorImg from '../../assets/media/multicolor.jpg';

import css from './FieldSwatch.module.css';

/**
 * IconCheckbox
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.checkedClassName overwrite components own css.checked
 * @param {string?} props.boxClassName overwrite components own css.box
 * @returns {JSX.Element} checkbox svg that places the native checkbox
 */
const IconSwatch = props => {
  const { className } = props;
  return (
    <svg className={className} width="14" height="14" xmlns="http://www.w3.org/2000/svg">
        <path
          className={css.checked}
          d="M5.636621 10.7824771L3.3573694 8.6447948c-.4764924-.4739011-.4764924-1.2418639 0-1.7181952.4777142-.473901 1.251098-.473901 1.7288122 0l1.260291 1.1254782 2.8256927-4.5462307c.3934117-.5431636 1.1545778-.6695372 1.7055985-.278265.5473554.3912721.6731983 1.150729.2797866 1.6951077l-3.6650524 5.709111c-.2199195.306213-.5803433.5067097-.9920816.5067097-.3225487 0-.6328797-.1263736-.8637952-.3560334z"
          fill="#FFF"
        />
    </svg>
  );
};

/**
 * Final Form Field containing checkbox input
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {string?} props.svgClassName is passed to checkbox svg as className
 * @param {string?} props.textClassName overwrite components own css.textRoot given to label
 * @param {string} props.id givent to input
 * @param {string} props.name Name groups several checkboxes to an array of selected values
 * @param {string} props.value Checkbox needs a value that is passed forward when user checks the checkbox
 * @param {ReactNode} props.label
 * @returns {JSX.Element} Final Form Field containing checkbox input
 */
const FieldSwatch = props => {
  const {
    rootClassName,
    className,
    svgClassName,
    textClassName,
    id,
    label,
    ...rest
  } = props;

  const classes = classNames(rootClassName || css.root, className);

  // This is a workaround for a bug in Firefox & React Final Form.
  // https://github.com/final-form/react-final-form/issues/134
  const handleOnChange = (input, event) => {
    const { onBlur, onChange } = input;
    onChange(event);
    onBlur(event);

    // If onChange has been passed as a props to FieldSwatch
    if (rest.onChange) {
      rest.onChange(event);
    }
  };

  const swatchColor = swatchColors[rest.value]
    ? {
      backgroundColor: swatchColors[rest.value],
      }
    : swatchBg[rest.value]
        ? {
          backgroundImage: 'url(' + swatchBg[rest.value] + ')',
          backgroundSize: 'contain',
        }
      : {};

  const disabledColorMaybe = rest.disabled
    ? {
        checkedClassName: css.checkedDisabled,
        boxClassName: css.boxDisabled,
      }
    : {};

  return (
    <span className={classes}>
      <Field type="checkbox" {...rest}>
        {props => {
          const { input, disabled } = props;
          return (
            <input
              id={id}
              className={css.input}
              {...input}
              onChange={event => handleOnChange(input, event)}
              disabled={disabled}
            />
          );
        }}
      </Field>
      <label htmlFor={id} className={css.label}>
        <span className={css.swatch} style={swatchColor}>
          <IconSwatch className={svgClassName} {...disabledColorMaybe} />
        </span>
        <span className={classNames(css.text, textClassName || css.textRoot)}>{label}</span>
      </label>

      
    </span>
  );
};

const swatchColors = {
  rojo: '#ff0000',
  rosa: 'pink',
  amarillo: 'yellow',
  naranja: 'orange',
  dorado: 'gold',
  plateado: 'silver',
  verde: 'green',
  azul: 'blue',
  morado: 'purple',
  negro: 'black',
  gris: 'gray',
  blanco: 'white',
  crema: 'wheat',
  cafe: 'brown',
};

const swatchBg = {
  'animal-print': multicolorImg,
  'floral-print': multicolorImg,
  multicolor: multicolorImg,
}

export default FieldSwatch;
