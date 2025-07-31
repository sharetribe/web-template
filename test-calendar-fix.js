// Test script to verify the calendar grid calculation fix
// This simulates the MonthlyCalendar logic for July 2025

const { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } = require('date-fns');

// Simulate the MonthlyCalendar logic
function testCalendarGridCalculation() {
  const currentMonth = new Date(2025, 6, 1); // July 1, 2025
  const firstDayOfWeek = 1; // Monday
  const monthStart = currentMonth;
  const monthEnd = endOfMonth(currentMonth);
  
  console.log('=== Testing Calendar Grid Calculation ===');
  console.log('Month:', format(currentMonth, 'MMMM yyyy'));
  console.log('First day of week:', firstDayOfWeek, '(Monday)');
  console.log('Month start:', monthStart.toDateString());
  console.log('Month end:', monthEnd.toDateString());
  console.log('Month start day of week:', getDay(monthStart), '(0=Sunday, 1=Monday, 2=Tuesday)');
  console.log('Month end day of week:', getDay(monthEnd), '(0=Sunday, 1=Monday, 2=Tuesday)');
  
  // OLD (buggy) calculation
  const oldStart = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1 - getDay(monthStart));
  const oldEnd = new Date(monthEnd.getFullYear(), monthEnd.getMonth() + 1, 7 - getDay(monthEnd));
  
  console.log('\n=== OLD (BUGGY) CALCULATION ===');
  console.log('Old start:', oldStart.toDateString(), '(should be Sunday)');
  console.log('Old end:', oldEnd.toDateString());
  
  // NEW (fixed) calculation
  const daysToSubtractFromStart = (getDay(monthStart) - firstDayOfWeek + 7) % 7;
  const calendarStart = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1 - daysToSubtractFromStart);
  
  const daysToAddToEnd = (7 - getDay(monthEnd) + firstDayOfWeek - 1) % 7;
  const calendarEnd = new Date(monthEnd.getFullYear(), monthEnd.getMonth(), monthEnd.getDate() + daysToAddToEnd);
  
  console.log('\n=== NEW (FIXED) CALCULATION ===');
  console.log('Days to subtract from start:', daysToSubtractFromStart);
  console.log('Days to add to end:', daysToAddToEnd);
  console.log('New start:', calendarStart.toDateString(), '(should be Monday)');
  console.log('New end:', calendarEnd.toDateString());
  
  // Generate calendar days
  const oldDays = eachDayOfInterval({ start: oldStart, end: oldEnd });
  const newDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  
  console.log('\n=== CALENDAR DAYS COMPARISON ===');
  console.log('Old days count:', oldDays.length);
  console.log('New days count:', newDays.length);
  
  console.log('\nOld calendar (first 7 days):');
  oldDays.slice(0, 7).forEach((day, index) => {
    console.log(`  ${index}: ${day.toDateString()} (${format(day, 'EEEE')})`);
  });
  
  console.log('\nNew calendar (first 7 days):');
  newDays.slice(0, 7).forEach((day, index) => {
    console.log(`  ${index}: ${day.toDateString()} (${format(day, 'EEEE')})`);
  });
  
  // Test specific dates
  const july31 = new Date(2025, 6, 31);
  console.log('\n=== JULY 31, 2025 TEST ===');
  console.log('July 31, 2025:', july31.toDateString());
  console.log('July 31 day of week:', getDay(july31), '(0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday)');
  console.log('Expected: Thursday (4)');
  console.log('Actual:', getDay(july31) === 4 ? '✅ CORRECT' : '❌ WRONG');
  
  // Check if July 31 appears in the correct position
  const july31InOldCalendar = oldDays.find(day => day.getDate() === 31 && day.getMonth() === 6);
  const july31InNewCalendar = newDays.find(day => day.getDate() === 31 && day.getMonth() === 6);
  
  console.log('\nJuly 31 in old calendar:', july31InOldCalendar ? july31InOldCalendar.toDateString() : 'Not found');
  console.log('July 31 in new calendar:', july31InNewCalendar ? july31InNewCalendar.toDateString() : 'Not found');
  
  if (july31InNewCalendar) {
    const dayOfWeek = getDay(july31InNewCalendar);
    console.log('July 31 day of week in new calendar:', dayOfWeek);
    console.log('Expected position: Thursday (4)');
    console.log('Result:', dayOfWeek === 4 ? '✅ CORRECT' : '❌ WRONG');
  }
}

testCalendarGridCalculation(); 