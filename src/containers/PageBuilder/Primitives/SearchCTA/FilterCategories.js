import React, { useState } from 'react';
import { Field } from 'react-final-form';
import classNames from 'classnames';
import { FormattedMessage } from '../../../../util/reactIntl';

import css from './FilterCategories.module.css';

const CategoryDropdown = ({ input, className, rootClassName, categories }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasSelected, setHasSelected] = useState(false);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleOptionClick = optionId => {
    // we want to submit an empty value to the form if the "All categories" value is selected
    const value = optionId === 'all-categories' ? '' : optionId;
    input.onChange(value);
    setHasSelected(true);
    setIsOpen(false);
  };

  // Identify the selected category
  const selectedCategory = categories.find(category => category.id === input.value);

  // Set the dropdown label: we store a hasSelected value in state to check if the user
  // has interacted with the form yet, i.e. selected a value. If not, we show a placeholder value
  const labelText = selectedCategory ? (
    selectedCategory.name
  ) : hasSelected && input.value === '' ? (
    <FormattedMessage id="CategoryFilter.selectAll" />
  ) : (
    <FormattedMessage id="CategoryFilter.placeholder" />
  );

  const rootClass = rootClassName || css.root;
  const classes = classNames(rootClass, className);

  return (
    <div className={classes}>
      <div className={css.dropdownContainer}>
        <div
          className={classNames(
            css.toggleButton,
            // If no selection has been made, no category is selected, and dropdown is closed, apply 'unselected' style
            // else, if dropdown is open but no selection has been made, apply placeholderOpened style
            !hasSelected && !selectedCategory && !isOpen && css.unselected,
            isOpen && !hasSelected && css.placeholderOpened
          )}
          onClick={toggleDropdown}
          type="button"
        >
          <span>{labelText}</span>
          <span className={classNames(css.chevron, isOpen && css.isOpen)} />
        </div>

        {isOpen && (
          <div className={css.dropdownContent}>
            <div
              className={css.option}
              onClick={() => handleOptionClick('all-categories')}
              type="button"
            >
              <span
                className={
                  hasSelected && input.value === ''
                    ? css.menuItemBorderSelected
                    : css.menuItemBorder
                }
              />
              <FormattedMessage id="CategoryFilter.selectAll" />
            </div>

            {categories.map(({ id, name }) => (
              <div
                key={id}
                className={css.option}
                onClick={() => handleOptionClick(id)}
                type="button"
              >
                <span
                  className={input.value === id ? css.menuItemBorderSelected : css.menuItemBorder}
                />
                {name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Final Form wrapper
const FilterCategories = props => {
  const { className, rootClassName, ...rest } = props;
  return (
    <Field
      {...rest}
      name="pub_categoryLevel1"
      component={CategoryDropdown}
      className={className}
      rootClassName={rootClassName}
    />
  );
};

export default FilterCategories;
