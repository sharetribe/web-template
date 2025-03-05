export const getGoogleCalendarEventDetails = tx => {
  if (!tx?.id) return null;
  return tx?.attributes?.metadata?.googleCalendarEventDetails;
};
