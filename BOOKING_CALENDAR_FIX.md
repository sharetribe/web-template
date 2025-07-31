# Booking Calendar UI Fix for New Listings

## Issue Description

New listings (e.g., "test" listing) were failing to display the booking calendar UI (Start date / End date + Request to book button). The expected behavior could be seen on existing listings (e.g., "X REVOLVE Davina Jumpsuit").

## Root Cause Analysis

The issue was caused by missing `availabilityPlan` data for new listings. Specifically:

1. **Missing Timezone**: New listings didn't have an `availabilityPlan.timezone` field
2. **OrderPanel Logic**: The `OrderPanel` component requires `timeZone` to be truthy to show the booking calendar
3. **Condition Check**: The condition `showBookingDatesForm = mounted && shouldHaveBookingDates && !isClosed && timeZone` was failing because `timeZone` was `undefined`

## Solution Implemented

### 1. Modified `EditListingDetailsPanel.js`

**Problem**: The `setNoAvailabilityForUnbookableListings` function only set availability plans for non-bookable listings, leaving bookable listings without any availability plan.

**Solution**: 
- Renamed function to `setAvailabilityPlanForListing` for clarity
- Added logic to provide a default 24/7 availability plan for bookable listings
- Maintained existing behavior for non-bookable listings

```javascript
// Before: Only non-bookable listings got availability plans
const setNoAvailabilityForUnbookableListings = processAlias => {
  return isBookingProcessAlias(processAlias)
    ? {}  // ❌ Bookable listings got no availability plan
    : { availabilityPlan: { ... } };
};

// After: All listings get appropriate availability plans
const setAvailabilityPlanForListing = processAlias => {
  const isBooking = isBookingProcessAlias(processAlias);
  
  if (isBooking) {
    // ✅ Bookable listings get a default 24/7 availability plan
    return {
      availabilityPlan: {
        type: 'availability-plan/time',
        timezone: 'Etc/UTC',
        entries: WEEKDAYS.map(dayOfWeek => ({
          dayOfWeek,
          startTime: '00:00',
          endTime: '24:00',
          seats: 1,
        })),
      },
    };
  } else {
    // Non-bookable listings get availability plan with no entries
    return { availabilityPlan: { ... } };
  }
};
```

### 2. Fixed Runtime Errors

**Problem**: Multiple places in the code were accessing `response.data.data` without proper null checks, causing runtime errors.

**Solution**: Added comprehensive null checks throughout the codebase:

- **EditListingPage.duck.js**: Fixed unsafe access in `requestCreateListingDraft`, `requestUpdateListing`, `requestImageUpload`, `requestAddAvailabilityException`, and `requestDeleteAvailabilityException`
- **EditListingWizardTab.js**: Fixed unsafe access in the response handling for new listing creation

```javascript
// Before: Unsafe access
const listingId = response.data.data.id;

// After: Safe access with null checks
if (response && response.data && response.data.data && response.data.data.id) {
  const listingId = response.data.data.id;
  // ... use listingId
} else {
  console.error("Invalid response structure", response);
  throw new Error("Invalid response structure");
}
```

### 3. Added Debug Logging

Added debug logging to both `EditListingDetailsPanel.js` and `OrderPanel.js` to help track the fix:

```javascript
// In EditListingDetailsPanel.js
console.log('🔧 [EditListingDetailsPanel] Setting availability plan for new listing:', {
  transactionProcessAlias,
  availabilityPlanData,
});

// In OrderPanel.js
console.log('🔍 [OrderPanel] Booking calendar debug:', {
  listingId: listing?.id?.uuid,
  hasAvailabilityPlan: !!listing?.attributes?.availabilityPlan,
  timeZone,
  isBooking,
  shouldHaveBookingDates,
  isClosed,
  mounted,
  showBookingDatesForm: mounted && shouldHaveBookingDates && !isClosed && timeZone,
});
```

## Testing

Created and ran a test script that verified:

1. **Availability Plan Function**: ✅ All test cases passed
   - Booking listings get proper availability plan with timezone and entries
   - Non-booking listings get availability plan with timezone but no entries

2. **OrderPanel Conditions**: ✅ Fix addresses the issue
   - Listings WITH availability plan: `showBookingDatesForm: Etc/UTC` (truthy, calendar shows)
   - Listings WITHOUT availability plan: `showBookingDatesForm: undefined` (falsy, calendar doesn't show)
   - After fix, new listings will have availability plans, so calendar will show

## Expected Behavior After Fix

1. **New Bookable Listings**: Will automatically get a default 24/7 availability plan with timezone
2. **Booking Calendar**: Will appear on new listings as expected
3. **Existing Listings**: Unaffected by the change
4. **Non-Booking Listings**: Continue to work as before
5. **Runtime Errors**: Eliminated through proper null checks

## Files Modified

1. `src/containers/EditListingPage/EditListingWizard/EditListingDetailsPanel/EditListingDetailsPanel.js`
   - Renamed `setNoAvailabilityForUnbookableListings` to `setAvailabilityPlanForListing`
   - Added logic to provide default availability plan for bookable listings
   - Added debug logging

2. `src/components/OrderPanel/OrderPanel.js`
   - Added debug logging to track booking calendar rendering conditions

3. `src/containers/EditListingPage/EditListingPage.duck.js`
   - Added null checks for `response.data.data` access in multiple functions
   - Fixed unsafe property access that was causing runtime errors

4. `src/containers/EditListingPage/EditListingWizard/EditListingWizardTab.js`
   - Added flexible response structure handling for new listing creation
   - Added comprehensive logging to debug response structure issues

## Verification

To verify the fix works:

1. Create a new listing with booking type (e.g., "Daily booking")
2. Check that the booking calendar appears on the listing page
3. Verify that existing listings continue to work as expected
4. Check browser console for debug logs showing availability plan creation and OrderPanel conditions
5. Confirm no runtime errors occur during listing creation or editing 