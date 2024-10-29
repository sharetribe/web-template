# DatePicker

There are 3 main components on this directory:

- DatePicker.js: core
- SingleDatePicker.js: uses DatePicker.js internally
- DateRangePickerjs: uses DatePicker.js internally

These components show calendar month that allows either pick a single date or a date range.

## Keyboard navigation

- Arrow keys: navigate between dates
- Space or Enter: select the currently focused date
- Page down: go to next month
- Page up: go to previous month
- Home: go to the first date on the current month
- End: go to the last date on the current month
- Escape: closes the calendar view (on SingleDatePicker & DateRangePicker)

## DatePicker.js

The core component that shows only the plain calendar view. It can be configured between single date
and date range mode.

## SingleDatePicker.js

SingleDatePicker has one input element that shows the selected date. Calendar view is shown as a
dropdown view after input has been clicked/focused.

## DateRangePicker.js

DateRangePicker has 2 inputs element that shows the selected date range. Calendar view is shown as a
dropdown view after input has been clicked/focused.
