import React from 'react';
import { Field } from 'react-final-form';
import classNames from 'classnames';

import { richText } from '../../util/richText';
import { ValidationError } from '../../components';

import css from './FieldSelectTree.module.css';

const MIN_LENGTH_FOR_LONG_WORDS = 16;
/**
 * Pick valid option configurations with format like:
 * [{ option, label, suboptions: [{ option, label }] }]
 *
 * @param {Array} options contain configs like { option, label, suboptions }
 * @param {Number} level specifies the nesting level
 * @returns an array of valid option configurations.
 */
const pickValidOptions = (options, level = 1) => {
  const isString = str => typeof str === 'string';
  const isValidOptions = opts => Array.isArray(opts);
  return options.reduce((picked, optionConfig) => {
    const { option, label, suboptions } = optionConfig;
    const isValid = isString(option) && isString(label);
    const suboptionsMaybe = isValidOptions(suboptions)
      ? { suboptions: pickValidOptions(suboptions, level + 1) }
      : {};
    const validOptionConfigMaybe = isValid ? [{ option, label, level, ...suboptionsMaybe }] : [];
    return [...picked, ...validOptionConfigMaybe];
  }, []);
};

const getSuboptions = optionConfig => optionConfig.suboptions;
const hasSuboptions = optionConfig => getSuboptions(optionConfig)?.length > 0;

/**
 * A component that represents a single option.
 *
 * @param {*} props include: config, level, handleChange, branchPath
 * @returns <li> wrapped elements.
 */
const Option = props => {
  const { config, level, handleChange, branchPath, ...rest } = props;
  const { option, label, suboptions } = config;
  const foundFromBranchPath = branchPath.find(bc => bc.option === option);
  const isOptSelected = !!foundFromBranchPath;
  const selectedSuboptions = branchPath.filter(bc => bc.level > foundFromBranchPath?.level);
  const isSuboptionSelected = selectedSuboptions.length > 0;
  const isClickable = !isOptSelected || (isOptSelected && isSuboptionSelected);
  const cursorMaybe = isClickable ? { cursor: 'pointer' } : { cursor: 'default' };

  const optionLabel = richText(label || option, {
    longWordMinLength: MIN_LENGTH_FOR_LONG_WORDS,
    longWordClass: css.longWord,
  });

  const buttonClasses = classNames({
    [css.optionBtn]: !isOptSelected,
    [css.optionBtnSelected]: isOptSelected,
    [css.optionBtnSelectedLowest]: isOptSelected && !isSuboptionSelected,
  });
  return (
    <li className={css.option} style={{ paddingLeft: `${12}px`, ...cursorMaybe }}>
      <button
        className={buttonClasses}
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();
          if (isClickable) {
            handleChange(option, level);
          }
        }}
      >
        {optionLabel}
      </button>

      {hasSuboptions(config) && isOptSelected ? (
        <SelectOptions
          options={suboptions}
          level={level + 1}
          handleChange={handleChange}
          branchPath={branchPath}
          {...rest}
        />
      ) : null}
    </li>
  );
};

/**
 * Presentational UI component wrapping <ul>.
 *
 * @param {*} props contains properties: hasOptions & children
 * @returns its children wrapped with <ul>
 */
const OptionList = props => {
  const { hasOptions, children } = props;
  return hasOptions ? <ul className={css.optionList}>{children}</ul> : null;
};

/**
 * Component, which allows user to select one of the options. Selected option might contain suboptions.
 *
 * @param {*} props must contain property options, which is an array of option configs.
 * @returns OptionList component.
 */
const SelectOptions = props => {
  const { options, ...rest } = props;
  return (
    <OptionList hasOptions={options?.length > 0}>
      {options.map(config => (
        <Option key={config.option} config={config} {...rest} />
      ))}
    </OptionList>
  );
};

/**
 * Returns an array of selected nested option configurations.
 * It roughly looks like this:
 * [
 *   { option: 'women', label: 'Women', levelKey: 'categoryLevel1', suboptions: [etc.] },
 *   { option: 'jackets', label: 'Jackets', levelKey: 'categoryLevel2' },
 * ]
 *
 * @param {Array} primaryOptions highest level of options
 * @param {Object} currentSelections selected nested options: { categoryLevel1: 'women', categoryLevel2: 'jacket' }
 * @returns an array of selected nested option configurations.
 */
const getBranchPath = (primaryOptions, currentSelections) => {
  const currentSelectionsEntries = Object.entries(currentSelections).sort(([k, v]) => k);
  return currentSelectionsEntries.reduce((branchPath, entry) => {
    const [levelKey, selectedOption] = entry;

    const currentOptions =
      branchPath.length > 0 ? branchPath[branchPath.length - 1].suboptions : primaryOptions;
    const foundOption = currentOptions.find(o => o.option === selectedOption);
    const foundOptionWithLevelKeyMaybe = foundOption ? [{ ...foundOption, levelKey }] : [];

    return [...branchPath, ...foundOptionWithLevelKeyMaybe];
  }, []);
};

/**
 * Handle value changes that happen when user clicks different options.
 *
 * @param {Array} primaryOptions highest level of options
 * @param {Object} currentSelections selected nested options: { categoryLevel1: 'women', categoryLevel2: 'jacket' }
 * @param {String} namePrefix like "categoryLevel"
 * @param {Function} onChange Final Form's onChange function.
 */
const handleChangeFn = (primaryOptions, currentSelections, namePrefix, onChange) => (
  currentOption,
  level
) => {
  const branchPath = getBranchPath(primaryOptions, currentSelections);

  const updatedCurrentBranchPath = branchPath.reduce((picked, selectedOptionByLevel) => {
    const { level: branchPathLevel, option: optionByLevel } = selectedOptionByLevel;
    const levelKey = `${namePrefix}${branchPathLevel}`;

    return branchPathLevel < level
      ? { ...picked, [levelKey]: optionByLevel }
      : branchPathLevel === level
      ? { ...picked, [levelKey]: currentOption }
      : picked;
  }, {});

  const levelKeyToUpdate = `${namePrefix}${level}`;
  const isUpdateANewBranchPath = updatedCurrentBranchPath[levelKeyToUpdate] == null;
  const updatedValue = isUpdateANewBranchPath
    ? { ...updatedCurrentBranchPath, [levelKeyToUpdate]: currentOption }
    : updatedCurrentBranchPath;

  onChange(updatedValue);
};

/**
 * @typedef {Object} SelectTreeOptionConfig
 * @property {string} option
 * @property {string} label
 * @property {Array<SelectTreeOptionConfig>} suboptions
 */

/**
 * Create Final Form field that represents "tree select" component,
 * where user can select nested options like categories.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {string} props.name Name of the input in Final Form
 * @param {ReactNode} props.label
 * @param {Array<SelectTreeOptionConfig>} props.options
 * @returns {JSX.Element} Final Form Field containing nested "select" input
 */
const FieldSelectTree = props => {
  const { className, rootClassName, label, name, options, ...rest } = props;
  const namePrefix = name;
  const level = 1;
  const validOptions = pickValidOptions(options);

  const classes = classNames(rootClassName || css.root, className);

  return (
    <Field name={name} {...rest}>
      {fieldProps => {
        const { value, onChange } = fieldProps?.input || {};
        const fieldValue = value ? value : {};
        const branchPath = getBranchPath(validOptions, fieldValue);
        const meta = fieldProps?.meta;

        return (
          <div className={classes}>
            {label ? <label>{label}</label> : null}
            <SelectOptions
              options={validOptions}
              level={level}
              handleChange={handleChangeFn(validOptions, fieldValue, namePrefix, onChange)}
              branchPath={branchPath}
            />

            <ValidationError fieldMeta={meta} />
          </div>
        );
      }}
    </Field>
  );
};

export default FieldSelectTree;
