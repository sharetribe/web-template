import React from 'react';
import '@testing-library/jest-dom';
import { Form as FinalForm } from 'react-final-form';

import { renderWithProviders as render, testingLibrary } from '../../util/testHelpers';
import * as validators from '../../util/validators';

import FieldSelectPopup from './FieldSelectPopup';

const { screen, userEvent } = testingLibrary;

const noop = () => {};

const FormComponent = ({ onToggleActive, ...props }) => (
  <FinalForm
    {...props}
    formId="test"
    render={fieldRenderProps => {
      const { formId, handleSubmit, invalid, pristine, submitting } = fieldRenderProps;
      const required = validators.required('This field is required');
      const submitDisabled = invalid || pristine || submitting;
      return (
        <form onSubmit={handleSubmit}>
          <FieldSelectPopup
            id={`${formId}.startTime`}
            name="startTime"
            label="Start time"
            validate={required}
            onToggleActive={onToggleActive}
          >
            <option disabled value="">
              Choose start time
            </option>
            <option value="09:00">9:00 AM</option>
            <option value="09:15">9:15 AM</option>
            <option value="09:30">9:30 AM</option>
          </FieldSelectPopup>
          <button type="submit" disabled={submitDisabled}>
            Submit
          </button>
        </form>
      );
    }}
  />
);

describe('FieldSelectPopup', () => {
  it('matches snapshot (closed, no value selected)', () => {
    const tree = render(<FormComponent onSubmit={noop} />);
    expect(tree.asFragment().firstChild).toMatchSnapshot();
  });

  it('shows the placeholder on the trigger and no option list until clicked', () => {
    render(<FormComponent onSubmit={noop} />);

    // The trigger's accessible name comes from the <label for> association, not its own text
    // content, since buttons don't expose a separate "value" the way role=combobox does.
    // getByLabelText finds it the same way it would for a native <select>.
    const trigger = screen.getByLabelText('Start time');
    expect(trigger).toHaveTextContent('Choose start time');
    expect(screen.queryByText('9:15 AM')).not.toBeInTheDocument();
  });

  it('opens the option list when the trigger is clicked', async () => {
    const user = userEvent.setup();
    render(<FormComponent onSubmit={noop} />);

    await user.click(screen.getByLabelText('Start time'));

    expect(screen.getByText('9:00 AM')).toBeInTheDocument();
    expect(screen.getByText('9:15 AM')).toBeInTheDocument();
    expect(screen.getByText('9:30 AM')).toBeInTheDocument();
  });

  it('selects an option, updates the trigger, closes the list, and enables submit', async () => {
    const user = userEvent.setup();
    render(<FormComponent onSubmit={noop} />);

    const trigger = screen.getByLabelText('Start time');
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
    await user.click(trigger);
    await user.click(screen.getByText('9:15 AM'));

    expect(trigger).toHaveTextContent('9:15 AM');
    expect(screen.queryByText('9:00 AM')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeEnabled();
  });

  it('shows a validation error once the field is touched and left empty', async () => {
    const user = userEvent.setup();
    render(<FormComponent onSubmit={noop} />);

    await user.click(screen.getByLabelText('Start time'));
    await user.tab();

    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  // jsdom doesn't compute real layout: offsetTop/offsetHeight/clientHeight/scrollHeight all
  // default to 0, so this stubs them to exercise (and verify the arithmetic of) the centering
  // logic. offsetTop/offsetHeight live on HTMLElement.prototype but clientHeight/scrollHeight
  // live on the more generic Element.prototype, so each property is restored on whichever
  // prototype actually owns it.
  const withMockedListLayout = (getters, run) => {
    const owner = prop =>
      Object.getOwnPropertyDescriptor(HTMLElement.prototype, prop)
        ? HTMLElement.prototype
        : Element.prototype;
    const originals = Object.keys(getters).map(prop => [
      prop,
      owner(prop),
      Object.getOwnPropertyDescriptor(owner(prop), prop),
    ]);
    originals.forEach(([prop]) => {
      Object.defineProperty(owner(prop), prop, { configurable: true, get: getters[prop] });
    });
    return Promise.resolve(run()).finally(() => {
      originals.forEach(([prop, protoOwner, descriptor]) => {
        Object.defineProperty(protoOwner, prop, descriptor);
      });
    });
  };

  it("scrolls the currently selected option into view by setting the list's own scrollTop, not via scrollIntoView (which could also scroll outer scrollable ancestors, e.g. a Modal)", async () => {
    const user = userEvent.setup();
    await withMockedListLayout(
      {
        offsetTop() {
          return this.dataset?.value === '09:15' ? 200 : 0;
        },
        offsetHeight() {
          return this.tagName === 'LI' ? 40 : 0;
        },
        clientHeight() {
          return this.tagName === 'UL' ? 272 : 0;
        },
        scrollHeight() {
          return this.tagName === 'UL' ? 1000 : 0;
        },
      },
      async () => {
        render(<FormComponent onSubmit={noop} initialValues={{ startTime: '09:15' }} />);
        await user.click(screen.getByLabelText('Start time'));

        const list = document.querySelector('.popupList');
        // centered = offsetTop(200) - clientHeight/2(136) + offsetHeight/2(20) = 84
        expect(list.scrollTop).toBe(84);
      }
    );
  });

  it("clamps the scroll-into-view offset to the list's own scrollable range", async () => {
    const user = userEvent.setup();
    await withMockedListLayout(
      {
        // Near the very top of the list: centering it would compute a negative scrollTop.
        offsetTop() {
          return this.dataset?.value === '09:15' ? 10 : 0;
        },
        offsetHeight() {
          return this.tagName === 'LI' ? 40 : 0;
        },
        clientHeight() {
          return this.tagName === 'UL' ? 272 : 0;
        },
        scrollHeight() {
          return this.tagName === 'UL' ? 1000 : 0;
        },
      },
      async () => {
        render(<FormComponent onSubmit={noop} initialValues={{ startTime: '09:15' }} />);
        await user.click(screen.getByLabelText('Start time'));

        const list = document.querySelector('.popupList');
        expect(list.scrollTop).toBe(0);
      }
    );
  });

  it('highlights the currently selected option', async () => {
    const user = userEvent.setup();
    render(<FormComponent onSubmit={noop} initialValues={{ startTime: '09:15' }} />);

    await user.click(screen.getByLabelText('Start time'));

    expect(screen.getByText('9:15 AM', { selector: 'li' })).toHaveClass('popupOptionSelected');
    expect(screen.getByText('9:00 AM')).not.toHaveClass('popupOptionSelected');
  });

  it('does not highlight the disabled placeholder when no value is selected yet', async () => {
    const user = userEvent.setup();
    // No initialValues, so input.value is '', which equals the placeholder's own value="".
    // Without the `!option.disabled` exclusion in the component, this exact case is what would
    // make the placeholder incorrectly pick up the "selected" highlight.
    render(<FormComponent onSubmit={noop} />);

    await user.click(screen.getByLabelText('Start time'));

    // The trigger itself also shows "Choose start time" when no value is selected, so scope to
    // the list item specifically.
    expect(screen.getByText('Choose start time', { selector: 'li' })).not.toHaveClass(
      'popupOptionSelected'
    );
  });

  describe('in-flow popup + edge-flip against the nearest scroll boundary', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("keeps the option list inside the field's own DOM subtree instead of portaling it out", async () => {
      const user = userEvent.setup();
      const { container } = render(<FormComponent onSubmit={noop} />);

      await user.click(screen.getByLabelText('Start time'));

      const option = screen.getByText('9:15 AM');
      expect(container.contains(option)).toBe(true);
    });

    it('calls onToggleActive with the new open state whenever the popup opens or closes', async () => {
      const user = userEvent.setup();
      const onToggleActive = jest.fn();
      render(<FormComponent onSubmit={noop} onToggleActive={onToggleActive} />);

      const trigger = screen.getByLabelText('Start time');
      await user.click(trigger);
      expect(onToggleActive).toHaveBeenLastCalledWith(true);

      await user.click(screen.getByText('9:15 AM'));
      expect(onToggleActive).toHaveBeenLastCalledWith(false);
    });

    it('opens below the trigger by default when there is enough room below it', async () => {
      const user = userEvent.setup();
      window.innerHeight = 768;
      jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function() {
        // Trigger near the top of the viewport: plenty of room below for the list, and no
        // scrollable ancestor exists, so this falls back to the viewport as the boundary.
        return this.tagName === 'BUTTON'
          ? { top: 100, bottom: 130, left: 20, right: 220, width: 200, height: 30 }
          : { top: 0, bottom: 272, left: 0, right: 0, width: 0, height: 272 };
      });

      render(<FormComponent onSubmit={noop} />);
      await user.click(screen.getByLabelText('Start time'));

      expect(document.querySelector('.popup')).not.toHaveClass('popupOpenAbove');
    });

    it('flips the popup above the trigger when there is not enough room below it (viewport fallback)', async () => {
      const user = userEvent.setup();
      window.innerHeight = 768;
      jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function() {
        // Trigger near the bottom of the viewport: the capped list (272px tall) doesn't fit in
        // the 38px left below it, but does fit in the 700px available above.
        return this.tagName === 'BUTTON'
          ? { top: 700, bottom: 730, left: 20, right: 220, width: 200, height: 30 }
          : { top: 0, bottom: 272, left: 0, right: 0, width: 0, height: 272 };
      });

      render(<FormComponent onSubmit={noop} />);
      await user.click(screen.getByLabelText('Start time'));

      expect(document.querySelector('.popup')).toHaveClass('popupOpenAbove');
    });

    it('measures against the nearest scrolling ancestor, not the viewport, when one exists', async () => {
      const user = userEvent.setup();
      window.innerHeight = 768;
      jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function() {
        if (this.tagName === 'BUTTON') {
          // Well within the viewport (768px tall), so a viewport-only check would find plenty of
          // room below and stay open downward.
          return { top: 300, bottom: 330, left: 20, right: 220, width: 200, height: 30 };
        }
        if (this.tagName === 'UL') {
          return { top: 0, bottom: 200, left: 0, right: 0, width: 0, height: 200 };
        }
        if (this.dataset?.scrollBoundary === 'true') {
          // A much smaller scroll container (e.g. a Modal's scroll layer) that only leaves 70px
          // below the trigger, even though the viewport itself has hundreds of pixels to spare.
          return { top: 50, bottom: 400, left: 0, right: 300, width: 300, height: 350 };
        }
        return { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0 };
      });

      render(
        <div data-scroll-boundary="true" style={{ overflowY: 'auto' }}>
          <FormComponent onSubmit={noop} />
        </div>
      );
      await user.click(screen.getByLabelText('Start time'));

      // 200px list, only 70px left below the trigger inside the scroll container (400 - 330),
      // but 250px available above it (300 - 50): should flip above despite the viewport having
      // room to spare below.
      expect(document.querySelector('.popup')).toHaveClass('popupOpenAbove');
    });
  });

  describe('outside-click-to-close', () => {
    it('closes without changing the value when clicking outside the popup', async () => {
      const user = userEvent.setup();
      const onToggleActive = jest.fn();
      render(
        <div>
          <FormComponent onSubmit={noop} onToggleActive={onToggleActive} />
          <button type="button">Somewhere else</button>
        </div>
      );

      await user.click(screen.getByLabelText('Start time'));
      expect(screen.getByText('9:15 AM')).toBeInTheDocument();

      await user.click(screen.getByText('Somewhere else'));

      expect(screen.queryByText('9:15 AM')).not.toBeInTheDocument();
      expect(onToggleActive).toHaveBeenLastCalledWith(false);
      // Closing via outside click must not touch the field's value.
      expect(screen.getByLabelText('Start time')).toHaveTextContent('Choose start time');
    });

    it('does not close when clicking an option inside the popup (selection still works)', async () => {
      const user = userEvent.setup();
      render(<FormComponent onSubmit={noop} />);

      const trigger = screen.getByLabelText('Start time');
      await user.click(trigger);
      await user.click(screen.getByText('9:15 AM'));

      expect(trigger).toHaveTextContent('9:15 AM');
    });

    it("clicking a different field's trigger closes this popup instead of leaving it open underneath", async () => {
      const user = userEvent.setup();
      const onToggleActive = jest.fn();
      const TwoFieldsFormComponent = () => (
        <FinalForm
          onSubmit={noop}
          formId="test"
          render={() => (
            <form>
              <FieldSelectPopup
                id="startTime"
                name="startTime"
                label="Start time"
                onToggleActive={onToggleActive}
              >
                <option disabled value="">
                  Choose start time
                </option>
                <option value="09:15">9:15 AM</option>
              </FieldSelectPopup>
              <FieldSelectPopup id="otherTime" name="otherTime" label="Other time">
                <option disabled value="">
                  Choose other time
                </option>
                <option value="10:00">10:00 AM</option>
              </FieldSelectPopup>
            </form>
          )}
        />
      );
      render(<TwoFieldsFormComponent />);

      await user.click(screen.getByLabelText('Start time'));
      expect(onToggleActive).toHaveBeenLastCalledWith(true);

      await user.click(screen.getByLabelText('Other time'));

      expect(onToggleActive).toHaveBeenLastCalledWith(false);
    });
  });

  describe('keyboard navigation and ARIA', () => {
    it('exposes aria-haspopup/aria-expanded/aria-controls, flipping aria-expanded on open', async () => {
      const user = userEvent.setup();
      render(<FormComponent onSubmit={noop} />);

      const trigger = screen.getByLabelText('Start time');
      expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(trigger).toHaveAttribute('aria-controls');
      expect(trigger).not.toHaveAttribute('aria-activedescendant');

      await user.click(trigger);

      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      expect(trigger).toHaveAttribute('aria-activedescendant');
      expect(screen.getByRole('listbox')).toHaveAttribute(
        'id',
        trigger.getAttribute('aria-controls')
      );
    });

    it('gives the list role="listbox" and every option role="option" with aria-selected', async () => {
      const user = userEvent.setup();
      render(<FormComponent onSubmit={noop} initialValues={{ startTime: '09:15' }} />);

      await user.click(screen.getByLabelText('Start time'));

      expect(screen.getByRole('listbox')).toBeInTheDocument();
      const selected = screen.getByRole('option', { name: '9:15 AM' });
      expect(selected).toHaveAttribute('aria-selected', 'true');
      const unselected = screen.getByRole('option', { name: '9:00 AM' });
      expect(unselected).toHaveAttribute('aria-selected', 'false');
    });

    it("composes the trigger's accessible name from the label and the current value, not the label alone", async () => {
      const user = userEvent.setup();
      render(<FormComponent onSubmit={noop} initialValues={{ startTime: '09:15' }} />);

      // A plain `<label for>` association alone would make the computed accessible name just
      // "Start time": the selected value would never be announced. aria-labelledby composes both.
      expect(screen.getByRole('button', { name: 'Start time 9:15 AM' })).toBeInTheDocument();

      await user.click(screen.getByLabelText('Start time'));
      await user.click(screen.getByRole('option', { name: '9:00 AM' }));

      expect(screen.getByRole('button', { name: 'Start time 9:00 AM' })).toBeInTheDocument();
    });

    it('opens the list with Enter when the trigger is focused, without changing the value', async () => {
      const user = userEvent.setup();
      render(<FormComponent onSubmit={noop} />);

      await user.tab();
      expect(screen.getByLabelText('Start time')).toHaveFocus();
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

      await user.keyboard('{Enter}');

      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('opens the list with Space too', async () => {
      const user = userEvent.setup();
      render(<FormComponent onSubmit={noop} />);

      await user.tab();
      await user.keyboard(' ');

      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('moves the highlight with ArrowDown/ArrowUp and selects the highlighted option with Enter, keeping focus on the trigger', async () => {
      const user = userEvent.setup();
      render(<FormComponent onSubmit={noop} />);

      const trigger = screen.getByLabelText('Start time');
      await user.tab();
      await user.keyboard('{ArrowDown}'); // opens; highlight starts on the first enabled option (9:00 AM)
      await user.keyboard('{ArrowDown}'); // moves highlight to 9:15 AM

      expect(trigger.getAttribute('aria-activedescendant')).toBe(
        screen.getByRole('option', { name: '9:15 AM' }).id
      );

      await user.keyboard('{Enter}');

      expect(trigger).toHaveTextContent('9:15 AM');
      expect(trigger).toHaveFocus();
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('selects the highlighted option with Space too, not just Enter, keeping focus on the trigger', async () => {
      const user = userEvent.setup();
      render(<FormComponent onSubmit={noop} />);

      const trigger = screen.getByLabelText('Start time');
      await user.tab();
      await user.keyboard(' '); // opens; highlight starts on the first enabled option (9:00 AM)
      await user.keyboard('{ArrowDown}'); // moves highlight to 9:15 AM

      await user.keyboard(' ');

      expect(trigger).toHaveTextContent('9:15 AM');
      expect(trigger).toHaveFocus();
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('does not move the highlight past the last option, and does not wrap around', async () => {
      const user = userEvent.setup();
      render(<FormComponent onSubmit={noop} />);

      await user.tab();
      await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}');

      expect(screen.getByRole('option', { name: '9:30 AM' })).toHaveAttribute(
        'aria-selected',
        'false'
      );
      expect(screen.getByLabelText('Start time').getAttribute('aria-activedescendant')).toBe(
        screen.getByRole('option', { name: '9:30 AM' }).id
      );
    });

    it('jumps to the first/last enabled option with Home/End', async () => {
      const user = userEvent.setup();
      render(<FormComponent onSubmit={noop} />);

      const trigger = screen.getByLabelText('Start time');
      await user.tab();
      await user.keyboard('{Enter}');
      await user.keyboard('{End}');

      expect(trigger.getAttribute('aria-activedescendant')).toBe(
        screen.getByRole('option', { name: '9:30 AM' }).id
      );

      await user.keyboard('{Home}');

      expect(trigger.getAttribute('aria-activedescendant')).toBe(
        screen.getByRole('option', { name: '9:00 AM' }).id
      );
    });

    it('closes on Escape without changing the value, keeping focus on the trigger', async () => {
      const user = userEvent.setup();
      render(<FormComponent onSubmit={noop} initialValues={{ startTime: '09:15' }} />);

      const trigger = screen.getByLabelText('Start time');
      await user.click(trigger);
      await user.keyboard('{ArrowDown}'); // would move the highlight to 9:30 AM if left open
      await user.keyboard('{Escape}');

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(trigger).toHaveTextContent('9:15 AM');
      expect(trigger).toHaveFocus();
    });

    it('closes the popup when tabbing away, without breaking mouse-based option selection', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <FormComponent onSubmit={noop} />
          <button type="button">Next field</button>
        </div>
      );

      await user.click(screen.getByLabelText('Start time'));
      expect(screen.getByRole('listbox')).toBeInTheDocument();

      await user.tab();

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Next field' })).toHaveFocus();
    });

    it('still selects an option by clicking it (the mousedown-preventDefault fix does not break the click)', async () => {
      const user = userEvent.setup();
      render(<FormComponent onSubmit={noop} />);

      const trigger = screen.getByLabelText('Start time');
      await user.click(trigger);
      await user.click(screen.getByRole('option', { name: '9:15 AM' }));

      expect(trigger).toHaveTextContent('9:15 AM');
      expect(trigger).toHaveFocus();
    });

    it("closing the popup with Escape does not also bubble to a wrapping Modal's document-level Escape listener", async () => {
      // Modal.js's own Escape-to-close handling listens for `keyup` on `document.body`
      // (Modal.js:91/137-142). This stands in for that listener without pulling in the real
      // Modal component, since what matters here is only whether the keyup reaches document.body,
      // not Modal's own internals.
      const user = userEvent.setup();
      const bodyKeyUpSpy = jest.fn();
      document.body.addEventListener('keyup', bodyKeyUpSpy);
      render(<FormComponent onSubmit={noop} />);

      try {
        await user.click(screen.getByLabelText('Start time'));
        expect(screen.getByRole('listbox')).toBeInTheDocument();

        await user.keyboard('{Escape}');

        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
        // The Escape that closed the popup must never reach document.body...
        expect(bodyKeyUpSpy).not.toHaveBeenCalled();

        await user.keyboard('{Escape}');

        // ...but with the popup already closed, a later Escape press is left alone and still
        // reaches document.body normally, so a wrapping Modal's own Escape-to-close still works.
        expect(bodyKeyUpSpy).toHaveBeenCalledTimes(1);
      } finally {
        document.body.removeEventListener('keyup', bodyKeyUpSpy);
      }
    });
  });

  describe('type-ahead find', () => {
    // A dedicated option set (distinct from the shared `FormComponent` above): a disabled
    // placeholder whose label also starts with "9" (still skipped), three "9..." options (for
    // same-character cycling), and a "1:00 PM"/"12:00 PM" pair (for multi-character narrowing,
    // since "1:00 PM" matches "1" alone but not "12").
    const TypeaheadFormComponent = () => (
      <FinalForm
        onSubmit={noop}
        formId="test"
        render={({ handleSubmit }) => (
          <form onSubmit={handleSubmit}>
            <FieldSelectPopup id="test.startTime" name="startTime" label="Start time">
              <option disabled value="">
                9 - Choose start time
              </option>
              <option value="09:00">9:00 AM</option>
              <option value="09:15">9:15 AM</option>
              <option value="09:30">9:30 AM</option>
              <option value="13:00">1:00 PM</option>
              <option value="12:00">12:00 PM</option>
            </FieldSelectPopup>
          </form>
        )}
      />
    );

    const activedescendantOptionName = trigger => {
      const activeId = trigger.getAttribute('aria-activedescendant');
      return activeId ? document.getElementById(activeId)?.textContent : null;
    };

    it('opens the popup and highlights the first match when typing while closed, skipping the disabled placeholder despite its label also starting with the typed character', async () => {
      const user = userEvent.setup();
      render(<TypeaheadFormComponent />);

      const trigger = screen.getByLabelText('Start time');
      await user.tab();
      expect(trigger).toHaveFocus();

      await user.keyboard('9');

      expect(screen.getByRole('listbox')).toBeInTheDocument();
      expect(activedescendantOptionName(trigger)).toBe('9:00 AM');
    });

    it('cycles to the next match on repeated presses of the same character, wrapping back to the first', async () => {
      const user = userEvent.setup();
      render(<TypeaheadFormComponent />);

      const trigger = screen.getByLabelText('Start time');
      await user.tab();

      await user.keyboard('9');
      expect(activedescendantOptionName(trigger)).toBe('9:00 AM');

      await user.keyboard('9');
      expect(activedescendantOptionName(trigger)).toBe('9:15 AM');

      await user.keyboard('9');
      expect(activedescendantOptionName(trigger)).toBe('9:30 AM');

      await user.keyboard('9');
      expect(activedescendantOptionName(trigger)).toBe('9:00 AM');
    });

    it('narrows to a more specific match when different characters are typed in quick succession', async () => {
      const user = userEvent.setup();
      render(<TypeaheadFormComponent />);

      const trigger = screen.getByLabelText('Start time');
      await user.tab();

      await user.keyboard('1');
      expect(activedescendantOptionName(trigger)).toBe('1:00 PM');

      await user.keyboard('2');
      expect(activedescendantOptionName(trigger)).toBe('12:00 PM');
    });

    it('leaves the highlight unchanged when no option matches the typed character', async () => {
      const user = userEvent.setup();
      render(<TypeaheadFormComponent />);

      const trigger = screen.getByLabelText('Start time');
      await user.click(trigger); // opens with the default highlight (first enabled option)
      expect(activedescendantOptionName(trigger)).toBe('9:00 AM');

      await user.keyboard('z');

      expect(screen.getByRole('listbox')).toBeInTheDocument();
      expect(activedescendantOptionName(trigger)).toBe('9:00 AM');
    });

    it('resets the search buffer after a pause, so a later single keystroke restarts from the first match instead of continuing the cycle', async () => {
      const user = userEvent.setup();
      render(<TypeaheadFormComponent />);

      const trigger = screen.getByLabelText('Start time');
      await user.tab();

      await user.keyboard('9');
      await user.keyboard('9');
      expect(activedescendantOptionName(trigger)).toBe('9:15 AM');

      // Longer than the 500ms reset window. Real timers, not fake ones, since user-event v14's
      // own internal delays don't compose cleanly with jest.useFakeTimers(), and a real ~600ms
      // wait is negligible next to the rest of this suite's runtime.
      await new Promise(resolve => setTimeout(resolve, 600));

      await user.keyboard('9');

      // If the buffer hadn't reset, this would continue the cycle to "9:30 AM" instead.
      expect(activedescendantOptionName(trigger)).toBe('9:00 AM');
    });
  });
});
