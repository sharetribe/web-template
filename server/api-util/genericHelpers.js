const isArrayLength = arr => {
  // Check if the input parameter is an array and has a length greater than zero.
  return Array.isArray(arr) && (arr.length > 0 ?? false);
};

const getListingCalendarEvents = l => {
  return l?.attributes?.privateData?.calendarEvents || [];
};

module.exports = {
  isArrayLength,
  getListingCalendarEvents,
};
