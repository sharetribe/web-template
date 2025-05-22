export const setCurrentPathnameAndInitiateAuth = (
  currentPathname,
  dispatch,
  InitiateGoogleAuth
) => {
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem('currentPathname', JSON.stringify(currentPathname));
  }

  dispatch(InitiateGoogleAuth());
};

export const getListingCurrentPathFromSessionStorage = () => {
  if (typeof window !== 'undefined') {
    const currentPath = window.sessionStorage.getItem('currentPathname');
    return JSON.parse(currentPath);
  }
};

export const getCalendarEvents = l => {
  return l?.attributes?.privateData?.calendarEvents;
};

export const isArrayLength = arr => {
  // Check if the input parameter is an array and has a length greater than zero.
  return Array.isArray(arr) && arr.length > 0;
};
