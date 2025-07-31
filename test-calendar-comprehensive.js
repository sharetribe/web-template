// Comprehensive test script to verify the calendar grid calculation fix
// Tests multiple months and edge cases

const { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } = require('date-fns');

function testCalendarGridCalculation(month, year, firstDayOfWeek = 1) {
  const currentMonth = new Date(year, month - 1, 1);
  const monthStart = currentMonth;
  const monthEnd = endOfMonth(currentMonth);
  
  console.log(`\n=== Testing ${format(currentMonth, 'MMMM yyyy')} ===`);
  console.log('First day of week:', firstDayOfWeek, '(0=Sunday, 1=Monday)');
  console.log('Month start:', monthStart.toDateString());
  console.log('Month end:', monthEnd.toDateString());
  console.log('Month start day of week:', getDay(monthStart));
  console.log('Month end day of week:', getDay(monthEnd));
  
  // NEW (fixed) calculation
  const daysToSubtractFromStart = (getDay(monthStart) - firstDayOfWeek + 7) % 7;
  const calendarStart = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1 - daysToSubtractFromStart);
  
  const daysToAddToEnd = (7 - getDay(monthEnd) + firstDayOfWeek - 1) % 7;
  const calendarEnd = new Date(monthEnd.getFullYear(), monthEnd.getMonth(), monthEnd.getDate() + daysToAddToEnd);
  
  console.log('Days to subtract from start:', daysToSubtractFromStart);
  console.log('Days to add to end:', daysToAddToEnd);
  console.log('Calendar start:', calendarStart.toDateString());
  console.log('Calendar end:', calendarEnd.toDateString());
  
  // Generate calendar days
  const newDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  
  console.log('Calendar days count:', newDays.length);
  
  // Show first week
  console.log('First week:');
  newDays.slice(0, 7).forEach((day, index) => {
    console.log(`  ${index}: ${day.toDateString()} (${format(day, 'EEEE')})`);
  });
  
  // Verify the first day is correct
  const expectedFirstDay = firstDayOfWeek === 0 ? 0 : 1; // Sunday or Monday
  const actualFirstDay = getDay(newDays[0]);
  const isCorrect = actualFirstDay === expectedFirstDay;
  
  console.log(`First day of week: ${actualFirstDay} (expected: ${expectedFirstDay}) - ${isCorrect ? '✅' : '❌'}`);
  
  return isCorrect;
}

function runComprehensiveTests() {
  console.log('🧪 COMPREHENSIVE CALENDAR GRID TESTING');
  console.log('========================================');
  
  // Test July 2025 (the reported bug)
  const july2025Correct = testCalendarGridCalculation(7, 2025, 1);
  
  // Test other months in 2025
  const months2025 = [1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12];
  const results2025 = months2025.map(month => testCalendarGridCalculation(month, 2025, 1));
  
  // Test edge cases
  const edgeCases = [
    { month: 1, year: 2025, firstDayOfWeek: 1 }, // January 2025
    { month: 2, year: 2025, firstDayOfWeek: 1 }, // February 2025 (28 days)
    { month: 12, year: 2025, firstDayOfWeek: 1 }, // December 2025
    { month: 7, year: 2025, firstDayOfWeek: 0 }, // July 2025 with Sunday first
  ];
  
  const edgeCaseResults = edgeCases.map(({ month, year, firstDayOfWeek }) => 
    testCalendarGridCalculation(month, year, firstDayOfWeek)
  );
  
  // Summary
  console.log('\n=== SUMMARY ===');
  console.log('July 2025 (reported bug):', july2025Correct ? '✅ FIXED' : '❌ STILL BROKEN');
  
  const allResults = [july2025Correct, ...results2025, ...edgeCaseResults];
  const passed = allResults.filter(Boolean).length;
  const total = allResults.length;
  
  console.log(`Overall: ${passed}/${total} tests passed`);
  console.log(allResults.every(Boolean) ? '🎉 ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  
  // Specific test for July 31, 2025
  console.log('\n=== JULY 31, 2025 SPECIFIC TEST ===');
  const july31 = new Date(2025, 6, 31);
  console.log('July 31, 2025:', july31.toDateString());
  console.log('Day of week:', getDay(july31), '(0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday)');
  console.log('Expected: Thursday (4)');
  console.log('Result:', getDay(july31) === 4 ? '✅ CORRECT' : '❌ WRONG');
}

runComprehensiveTests(); 