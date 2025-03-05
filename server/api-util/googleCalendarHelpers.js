const getDayIndex = dayOfWeek => {
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return days.indexOf(dayOfWeek.toLowerCase());
};
const getDateTimeForDay = (dayOfWeek, time) => {
  const now = new Date();
  const [hours, minutes] = time.split(':').map(Number);
  const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);

  // Adjust to the correct day of the week
  const currentDayIndex = now.getDay();
  const targetDayIndex = getDayIndex(dayOfWeek);
  const dayDifference = (targetDayIndex - currentDayIndex + 7) % 7;
  targetDate.setDate(now.getDate() + dayDifference);

  return targetDate;
};
// Function to format date object to HH:mm
const formatTime = date => {
  if (!date) return null;

  // Ensure that the date is a Date object
  const parsedDate = typeof date === 'string' ? new Date(date) : date;

  return `${parsedDate
    .getHours()
    .toString()
    .padStart(2, '0')}:${parsedDate
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
};

module.exports = {
  getDateTimeForDay,
  formatTime,
};
