import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Field } from 'react-final-form';
import classNames from 'classnames';

import { useIntl } from '../../util/reactIntl';

import { OutsideClickHandler, ValidationError, HelpText } from '../../components';

import { getScrollBoundary, moveHighlight, findTypeaheadMatch } from './FieldSelectPopup.helpers';
import css from './FieldSelectPopup.module.css';

const TYPEAHEAD_RESET_MS = 500;

const FieldSelectPopupComponent = props => {
  const intl = useIntl();
  const {
    rootClassName,
    className,
    selectClassName,
    labelClassName,
    id,
    label,
    helpText,
    input,
    meta,
    options = [],
    onChange,
    onToggleActive,
    showLabelAsDisabled,
    disabled,
    ...rest
  } = props;

  if (label && !id) {
    throw new Error('id required when a label is given');
  }

  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const listRef = useRef(null);
  // Toggles which CSS anchor is active (`top: 100%` vs `bottom: 100%`), so opening above the
  // trigger needs no pixel math. See the layout effect below.
  const [openAbove, setOpenAbove] = useState(false);
  // The keyboard-highlighted option, independent of input.value (the committed selection). -1
  // means no highlight, always true while closed. Drives the `.popupOptionHighlighted` class and
  // `aria-activedescendant`.
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  // keydown and keyup fire as separate DOM events. This ref carries state from the Escape keydown
  // handler to the matching keyup handler below, so the keyup knows to stop itself from also
  // closing a wrapping Modal.
  const suppressNextEscapeKeyUpRef = useRef(false);
  // The accumulated search string, and the timer that clears it after a pause (see
  // handleTypeahead). Plain refs, not state: neither needs to trigger a re-render, unlike
  // highlightedIndex.
  const typeaheadQueryRef = useRef('');
  const typeaheadResetTimeoutRef = useRef(null);
  // Hands a type-ahead match to the "on open" effect below, so it highlights that match instead
  // of its own default. Needed because that effect runs after this same `isOpen` change and would
  // otherwise overwrite the match.
  const pendingHighlightIndexRef = useRef(null);

  const setOpen = next => {
    setIsOpen(next);
    onToggleActive?.(next);
  };

  const { invalid, touched, error } = meta;
  const hasError = touched && invalid && error;

  const selectedOption = options.find(o => o.value === input.value);
  const hasSelection = Boolean(selectedOption) && !selectedOption.disabled;
  const enabledIndices = options.reduce((acc, o, i) => (o.disabled ? acc : [...acc, i]), []);

  // Highlights the current selection when the popup opens, or the first enabled option if
  // nothing's selected yet, so aria-activedescendant is meaningful right away and arrow
  // keys/Home/End have a sensible start. Clears the highlight on close, so it's recomputed fresh
  // next time.
  useEffect(() => {
    if (!isOpen) {
      setHighlightedIndex(-1);
      return;
    }
    if (pendingHighlightIndexRef.current !== null) {
      setHighlightedIndex(pendingHighlightIndexRef.current);
      pendingHighlightIndexRef.current = null;
      return;
    }
    const selectedIndex = options.findIndex(o => o.value === input.value && !o.disabled);
    setHighlightedIndex(selectedIndex !== -1 ? selectedIndex : enabledIndices[0] ?? -1);
  }, [isOpen]);

  // Keep the highlighted option roughly centered in the list. That covers both opening on the
  // current value (like a native <select>) and keyboard navigation afterward. The list can
  // outgrow the viewport via .popupList's max-height.
  //
  // Set `list.scrollTop` directly instead of `node.scrollIntoView({ block: 'center' })`: the
  // latter also scrolls a wrapping Modal and causes a visible jump. Clamp to the list's scroll
  // range so options near the top/bottom don't overscroll.
  useEffect(() => {
    if (!isOpen || !listRef.current || highlightedIndex === -1) {
      return;
    }
    const list = listRef.current;
    const value = options[highlightedIndex]?.value;
    const node = list.querySelector(`[data-value="${CSS.escape(String(value))}"]`);
    if (!node) {
      return;
    }
    const centered = node.offsetTop - list.clientHeight / 2 + node.offsetHeight / 2;
    list.scrollTop = Math.max(0, Math.min(centered, list.scrollHeight - list.clientHeight));
  }, [isOpen, highlightedIndex]);

  // Decides whether the list opens above the trigger instead of below it, matching native
  // <select>'s edge behavior. Measures against the nearest ancestor that clips vertical overflow,
  // such as a Modal's scroll layer, since that's the real boundary the popup can't extend past.
  // Falls back to the viewport when there's no such ancestor. Runs in a layout effect so the
  // decision lands before the popup paints.
  useLayoutEffect(() => {
    if (!isOpen) {
      return;
    }
    const trigger = triggerRef.current;
    const list = listRef.current;
    if (!trigger || !list) {
      return;
    }
    const triggerRect = trigger.getBoundingClientRect();
    const listHeight = list.getBoundingClientRect().height;
    const boundary = getScrollBoundary(trigger);
    const visibleTop = Math.max(boundary.top, 0);
    const visibleBottom = Math.min(boundary.bottom, window.innerHeight);
    const spaceBelow = visibleBottom - triggerRect.bottom;
    const spaceAbove = triggerRect.top - visibleTop;
    const fitsBelow = listHeight <= spaceBelow;
    const fitsAbove = listHeight <= spaceAbove;
    // Prefers opening below, matching native <select>. Flips above only when below doesn't fit
    // and above does, or, as a last resort, when above simply has more room.
    setOpenAbove(!fitsBelow && (fitsAbove || spaceAbove > spaceBelow));
  }, [isOpen]);

  const selectValue = value => {
    input.onChange(value);
    if (onChange) {
      onChange(value);
    }
    setOpen(false);
  };

  // Accumulates printable characters typed in quick succession into a search string, then moves
  // the highlight to whatever findTypeaheadMatch finds. Ignores modified key combinations
  // (Ctrl/Alt/Meta) and multi-character keys like "ArrowDown", since handleKeyDown already
  // handles those. It only moves the highlight and never commits a value.
  const handleTypeahead = event => {
    if (event.key.length !== 1 || event.ctrlKey || event.altKey || event.metaKey) {
      return;
    }
    window.clearTimeout(typeaheadResetTimeoutRef.current);
    typeaheadQueryRef.current += event.key;
    typeaheadResetTimeoutRef.current = window.setTimeout(() => {
      typeaheadQueryRef.current = '';
    }, TYPEAHEAD_RESET_MS);

    const match = findTypeaheadMatch(
      typeaheadQueryRef.current,
      options,
      enabledIndices,
      highlightedIndex
    );
    if (match === -1) {
      return;
    }
    event.preventDefault();
    if (isOpen) {
      setHighlightedIndex(match);
    } else {
      // Opening also triggers the "on open" effect above, which would otherwise overwrite this
      // match with its own default. The ref hands the match to that effect instead, so they
      // don't compete.
      pendingHighlightIndexRef.current = match;
      setOpen(true);
    }
  };

  // preventDefault on Enter/Space stops the button's own native click-on-activation, so this
  // handler is the single source of truth for those keys.
  const handleKeyDown = event => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        isOpen
          ? setHighlightedIndex(moveHighlight('down', enabledIndices, highlightedIndex))
          : setOpen(true);
        break;
      case 'ArrowUp':
        event.preventDefault();
        isOpen
          ? setHighlightedIndex(moveHighlight('up', enabledIndices, highlightedIndex))
          : setOpen(true);
        break;
      case 'Home':
        if (isOpen && enabledIndices.length > 0) {
          event.preventDefault();
          setHighlightedIndex(enabledIndices[0]);
        }
        break;
      case 'End':
        if (isOpen && enabledIndices.length > 0) {
          event.preventDefault();
          setHighlightedIndex(enabledIndices[enabledIndices.length - 1]);
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!isOpen) {
          setOpen(true);
        } else if (highlightedIndex !== -1) {
          selectValue(options[highlightedIndex].value);
        } else {
          setOpen(false);
        }
        break;
      case 'Escape':
        if (isOpen) {
          event.preventDefault();
          // keydown and keyup are independent DOM events for the same key press, so
          // preventDefault here has no effect on the keyup that follows. Without suppressing that
          // keyup too, it bubbles to a wrapping Modal's own Escape listener
          // (`Modal.js`'s `handleBodyKeyUp`) and closes the Modal too.
          suppressNextEscapeKeyUpRef.current = true;
          setOpen(false);
        }
        break;
      default:
        handleTypeahead(event);
        break;
    }
  };

  // Consumes the keyup half of an Escape press that just closed the popup on keydown, stopping it
  // from bubbling to a wrapping Modal's own Escape listener. Can't check `isOpen` instead: by the
  // time this fires, the keydown handler has already set it to `false`.
  const handleKeyUp = event => {
    if (event.key === 'Escape' && suppressNextEscapeKeyUpRef.current) {
      event.stopPropagation();
      suppressNextEscapeKeyUpRef.current = false;
    }
  };

  // Closes the popup when focus moves away from the trigger (e.g. tabbing away), in addition to
  // the outside-click handling below. Clicking an option doesn't blur the trigger first:
  // .popupList's onMouseDown below prevents the browser's default focus shift for a mousedown on
  // a non-focusable descendant. So this only fires for a genuine focus-left-the-trigger event.
  const handleBlur = event => {
    input.onBlur(event);
    if (isOpen) {
      setOpen(false);
    }
  };

  const labelClasses = classNames({
    [css.labelDisabled]: showLabelAsDisabled,
    [labelClassName]: !!labelClassName,
  });
  const classes = classNames(rootClassName || css.root, className);
  const triggerClasses = classNames(css.trigger, {
    [selectClassName]: selectClassName,
    [css.triggerError]: hasError,
  });

  const labelId = label ? `${id}-label` : undefined;
  const valueId = `${id}-value`;
  const listboxId = `${id}-listbox`;
  const optionId = index => `${id}-option-${index}`;

  return (
    <OutsideClickHandler rootClassName={classes} onOutsideClick={() => setOpen(false)}>
      {label ? (
        <label id={labelId} htmlFor={id} className={labelClasses}>
          {label}
        </label>
      ) : null}
      <div className={css.popupWrapper}>
        <button
          type="button"
          id={id}
          className={triggerClasses}
          disabled={disabled}
          onFocus={input.onFocus}
          onBlur={handleBlur}
          onClick={() => setOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          ref={triggerRef}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={
            isOpen && highlightedIndex !== -1 ? optionId(highlightedIndex) : undefined
          }
          // Builds a hidden label for accessibility purposes, since a plain `<label for>` would
          // only announce itself. It combines two pieces of information into the trigger's
          // accessible name: the field label and the current value.
          {...(labelId ? { 'aria-labelledby': `${labelId} ${valueId}` } : {})}
          {...rest}
        >
          {/* Shows the placeholder to sighted users only, since it isn't a real value. The span
              below provides the accessible name instead. */}
          <span aria-hidden="true" className={css.triggerLabel}>
            {selectedOption?.label}
          </span>
          <span id={valueId} className={css.srOnlyValue}>
            {hasSelection
              ? selectedOption.label
              : intl.formatMessage({ id: 'FieldSelectPopup.screenreader.notSelected' })}
          </span>
        </button>
        {isOpen ? (
          <div className={classNames(css.popup, { [css.popupOpenAbove]: openAbove })}>
            <ul
              className={css.popupList}
              ref={listRef}
              role="listbox"
              id={listboxId}
              // No aria-labelledby here: the listbox has no name of its own since the trigger's
              // label already gives context.
              // Prevents the browser's default mousedown focus-shift: these <li>s aren't
              // focusable, so focus would otherwise move to the document.
              onMouseDown={event => event.preventDefault()}
            >
              {options.map((option, index) => (
                <li
                  key={option.value}
                  id={optionId(index)}
                  data-value={option.value}
                  role="option"
                  aria-selected={option.value === input.value && !option.disabled}
                  aria-disabled={option.disabled || undefined}
                  className={classNames(css.popupOption, {
                    [css.popupOptionDisabled]: option.disabled,
                    // Excludes disabled options (the placeholder): an unselected placeholder
                    // shouldn't look "selected" just because its value happens to match an
                    // empty input.value.
                    [css.popupOptionSelected]: option.value === input.value && !option.disabled,
                    [css.popupOptionHighlighted]: index === highlightedIndex,
                  })}
                  onClick={() => !option.disabled && selectValue(option.value)}
                >
                  {option.label}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      <HelpText helpText={helpText} />
      <ValidationError fieldMeta={meta} />
    </OutsideClickHandler>
  );
};

/**
 * A form field with a button trigger that opens a custom option list, instead of a native
 * <select>. Renders the custom trigger at every viewport, and supports keyboard navigation,
 * type-ahead find, and ARIA.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {string?} props.selectClassName add more style rules to the trigger button
 * @param {string} props.name Name of the input in Final Form
 * @param {string} props.id Required when label is given, so the label can reference the input via `for`
 * @param {ReactNode} props.label
 * @param {Array<{value: string, label: ReactNode, disabled: boolean}>} props.options Options to render. The first should be a disabled placeholder
 * @param {boolean} props.disabled Whether the trigger is disabled
 * @param {boolean} props.showLabelAsDisabled Whether the label is disabled
 * @param {Function?} props.onToggleActive Called with the new open/closed boolean, so a caller can
 * raise a clipping ancestor's z-index only while the popup is open.
 * @returns {JSX.Element} Final Form Field containing a trigger button and a toggled option list
 */
const FieldSelectPopup = props => {
  return <Field component={FieldSelectPopupComponent} {...props} />;
};

export default FieldSelectPopup;
