import React, { useState, useRef } from 'react';
import { Field } from 'react-final-form';
import classNames from 'classnames';
import { FormattedMessage } from '../../../../../util/reactIntl';

import { OutsideClickHandler } from '../../../../../components';

import css from './FilterCategories.module.css';

const CategoryDropdown = ({ input, className, rootClassName, categories, alignLeft }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [hasSelected, setHasSelected] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(prev => !prev);
    if (!isOpen) {
      // reset the index used to navigate menu items using keyboard when the menu is closed
      setActiveIndex(-1);
    }
  };

  const handleOptionClick = optionId => {
    const value = optionId === 'all-categories' ? '' : optionId;
    input.onChange(value);
    setHasSelected(true);
    setIsOpen(false);
  };

  // keydown handling when navigating menu using keyboard
  const handleKeyDown = e => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
        setActiveIndex(0);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => {
        if (prev < allOptions.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => {
        if (prev > 0) {
          return prev - 1;
        }
        return prev;
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = allOptions[activeIndex];
      if (selected) handleOptionClick(selected.id);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  const selectedCategory = categories.find(category => category.id === input.value);

  const labelText = selectedCategory ? (
    selectedCategory.name
  ) : hasSelected && input.value === '' ? (
    <FormattedMessage id="PageBuilder.SearchCTA.CategoryFilter.selectAll" />
  ) : (
    <FormattedMessage id="PageBuilder.SearchCTA.CategoryFilter.placeholder" />
  );

  const rootClass = rootClassName || css.root;
  const classes = classNames(rootClass, className);

  // append the "all categories" option to the list of categories
  const allOptions = [
    {
      id: 'all-categories',
      name: <FormattedMessage id="PageBuilder.SearchCTA.CategoryFilter.selectAll" />,
    },
    ...categories,
  ];

  const optionRefs = useRef([]);

  return (
    <OutsideClickHandler className={classes} onOutsideClick={() => setIsOpen(false)}>
      <div className={css.dropdownContainer}>
        <div
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-owns="category-listbox"
          aria-controls="category-listbox"
          tabIndex={0}
          onClick={toggleDropdown}
          onKeyDown={handleKeyDown}
          className={classNames(css.toggleButton, {
            [css.unselected]: !hasSelected && !selectedCategory && !isOpen,
            [css.placeholderOpened]: isOpen && !hasSelected,
          })}
        >
          <span className={css.dropdownItem}>{labelText}</span>
          <span className={classNames(css.chevron, isOpen && css.isOpen)} />
        </div>

        {isOpen && (
          <ul
            className={classNames(css.dropdownContent, {
              [css.alignLeft]: alignLeft,
            })}
            role="listbox"
            id="category-listbox"
          >
            {allOptions.map(({ id, name }, index) => {
              const isSelected =
                id === input.value || (id === 'all-categories' && input.value === '');
              const isActive = index === activeIndex;
              return (
                <li
                  key={id}
                  ref={option => (optionRefs.current[index] = option)}
                  className={classNames(css.option, {
                    [css.activeOption]: isActive,
                  })}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleOptionClick(id)}
                >
                  <span
                    className={isSelected ? css.dropdownItemBorderSelected : css.dropdownItemBorder}
                  />
                  {name}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </OutsideClickHandler>
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
