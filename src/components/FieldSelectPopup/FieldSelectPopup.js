import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Field } from 'react-final-form';
import classNames from 'classnames';

import { OutsideClickHandler, ValidationError, HelpText } from '../../components';

import {
  optionsFromChildren,
  getScrollBoundary,
  moveHighlight,
  findTypeaheadMatch,
} from './FieldSelectPopup.helpers';
import css from './FieldSelectPopup.module.css';

const FieldSelectPopupComponent = props => {
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
    children,
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
  // Whether the list should open above the trigger instead of below it (see the layout effect
  // below). The popup stays a normal in-flow child, so this only switches which CSS anchor
  // (`top: 100%` vs `bottom: 100%`) is in effect; no pixel math needed.
  const [openAbove, setOpenAbove] = useState(false);
  // The keyboard-highlighted option index, independent of `input.value` (the committed
  // selection). -1 means "no highlight" (always true while closed). Drives the visual
  // `.popupOptionHighlighted` class and `aria-activedescendant`.
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  // Set synchronously (not via state, see `handleKeyUp`'s comment below) whenever an Escape
  // keydown closes the popup, so the matching keyup (a separate DOM event this component can't
  // otherwise tie back to that keydown) knows to stop itself from also closing an ancestor Modal.
  const suppressNextEscapeKeyUpRef = useRef(false);
  // Type-ahead find (see `handleTypeahead`): the accumulated search string typed so far, and the
  // timer that clears it after a pause. Plain refs, not state, since neither needs to trigger a
  // re-render on its own; only `highlightedIndex` (set as a side effect of a match) does.
  const typeaheadQueryRef = useRef('');
  const typeaheadResetTimeoutRef = useRef(null);
  // When type-ahead opens an already-closed popup, it needs to land the highlight on its match,
  // not the "on open" effect's own default. That effect runs after this same `isOpen` change and
  // would otherwise overwrite the match, so this ref hands the match to it instead.
  const pendingHighlightIndexRef = useRef(null);

  const setOpen = next => {
    setIsOpen(next);
    onToggleActive?.(next);
  };

  const { invalid, touched, error } = meta;

  // Error message and input error styles are only shown if the
  // field has been touched and the validation has failed.
  const hasError = touched && invalid && error;

  const options = optionsFromChildren(children);
  const selectedOption = options.find(o => o.value === input.value);
  const enabledIndices = options.reduce((acc, o, i) => (o.disabled ? acc : [...acc, i]), []);

  // On open, highlight the current selection (or the first enabled option, if nothing is
  // selected yet) so aria-activedescendant is meaningful immediately and arrow keys/Home/End have
  // a sensible starting point without a first keypress "wasted" just establishing one. On close,
  // clear the highlight so it's recomputed fresh next time rather than carried over stale.
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

  // Keeps the keyboard-highlighted option in view while navigating, the same way native <select>
  // scrolls to the current value on open.
  // Sets `scrollTop` directly instead of `node.scrollIntoView({ block: 'center' })`: scrollIntoView
  // also scrolled a wrapping Modal's own scroll layer, causing a visible jump. Clamped to the
  // list's own scrollable range so an option near the top/bottom doesn't overscroll.
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
  // <select>'s viewport-edge behavior. Measured against the nearest ancestor that clips vertical
  // overflow (e.g. a Modal's scroll layer), the real boundary the in-flow popup can't extend past;
  // getScrollBoundary falls back to the viewport when there's no such ancestor. Runs in a layout
  // effect so the decision is in place before the popup paints.
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
    // Prefer below (native <select>'s default); flip above only when below doesn't fit, and
    // either above fits properly or, as a last resort when neither fully fits, above simply has
    // more room to work with.
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
  // the highlight to whatever `findTypeaheadMatch` finds. Ignores modified key combinations
  // (Ctrl/Alt/Meta) and multi-character keys like "ArrowDown", already handled by `handleKeyDown`.
  // Only moves the highlight; it never commits a value on its own.
  const handleTypeahead = event => {
    if (event.key.length !== 1 || event.ctrlKey || event.altKey || event.metaKey) {
      return;
    }
    window.clearTimeout(typeaheadResetTimeoutRef.current);
    typeaheadQueryRef.current += event.key;
    typeaheadResetTimeoutRef.current = window.setTimeout(() => {
      typeaheadQueryRef.current = '';
    }, 500);

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
      // match with its own default. Handing the match off via the ref lets that effect apply it
      // instead of the two competing.
      pendingHighlightIndexRef.current = match;
      setOpen(true);
    }
  };

  // Enter/Space open the list (or select the highlighted option, if already open); Arrow
  // Up/Down open the list (matching native <select>) or move the highlight; Home/End jump to the
  // first/last enabled option; Escape closes without changing the value.
  // preventDefault on Enter/Space suppresses the button's own native click-on-activation, so this
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
  // the outside-click handling below. Clicking an option doesn't blur the trigger first, since
  // `.popupList`'s `onMouseDown` below prevents the browser's default focus-shifting behavior for
  // mousedown on a non-focusable descendant.
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

  // ARIA ids. `labelId` only exists when `label` is actually rendered (it's an optional prop:
  // AvailabilityPlanEntries.js, for instance, relies on its own external <label> instead), so
  // `aria-labelledby` is only wired up when there's something for it to point at.
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
          // Overrides the plain `<label for>` accessible-name association above: a `<label for>`
          // alone wins over the button's own text content, so a screen reader would announce only
          // "Start time, button" and never the selected value. Pointing aria-labelledby at both
          // the label and the value span composes them into one name, e.g. "Start time, 9:15 AM".
          {...(labelId ? { 'aria-labelledby': `${labelId} ${valueId}` } : {})}
          {...rest}
        >
          <span id={valueId} className={css.triggerLabel}>
            {selectedOption?.label}
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
 * @param {string} props.id Label is optional, but if it is given, an id is also required so the label can reference the input in the `for` attribute
 * @param {ReactNode} props.label
 * @param {ReactNode} props.children <option> elements; the first should be a disabled placeholder
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
