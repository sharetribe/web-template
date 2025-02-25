const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const RETRY_STORAGE_DELAY = 20000; // 20 seconds
const RETRY_SDK_DELAY = 60000; // 60 seconds

async function retryAsync(fn, retries = 3, delayMs = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn(); // Try executing the function
    } catch (error) {
      if (attempt < retries) {
        await delay(delayMs); // Wait before retrying
        console.log(`[retryAsync] Retrying... (${attempt}/${retries})`);
      } else {
        console.log(`[retryAsync] Failed after ${retries} attempts.`);
        throw error; // If all retries fail, throw the error
      }
    }
  }
}

module.exports = {
  retryAsync,
  RETRY_STORAGE_DELAY,
  RETRY_SDK_DELAY,
};
