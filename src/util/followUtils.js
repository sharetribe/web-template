// Utility functions for follow system development and debugging

/**
 * Reset all follower counts in localStorage
 * Useful for development when you want to start fresh
 */
export const resetFollowerCounts = () => {
  try {
    localStorage.removeItem('sharetribe_follower_counts');
    console.log('✅ Follower counts reset successfully. Refresh the page to see the changes.');
    return true;
  } catch (error) {
    console.error('❌ Error resetting follower counts:', error);
    return false;
  }
};

/**
 * Get current follower counts from localStorage
 * Useful for debugging
 */
export const getFollowerCounts = () => {
  try {
    const saved = localStorage.getItem('sharetribe_follower_counts');
    const counts = saved ? JSON.parse(saved) : {};
    console.log('Current follower counts:', counts);
    return counts;
  } catch (error) {
    console.error('❌ Error getting follower counts:', error);
    return {};
  }
};

// Make these functions available globally for development
if (typeof window !== 'undefined') {
  window.resetFollowerCounts = resetFollowerCounts;
  window.getFollowerCounts = getFollowerCounts;
} 