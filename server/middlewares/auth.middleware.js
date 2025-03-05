const { ApiError } = require('../api-util/ApiError');
const { ApiResponse } = require('../api-util/ApiResponse');

const ERROR_MESSAGE = 'Failed to load user information. Please ensure you are authenticated.';

const isAuthenticated = async (req, res, next) => {
  try {
    const stCookie = Object.keys(req.cookies).find(cookie => cookie.startsWith('st-'));

    if (!stCookie) {
      throw new ApiError(401, 'Authentication required: No valid "st-" cookie found');
    }

    const { access_token: accessToken } = JSON.parse(req.cookies[stCookie]) || {};
    if (!accessToken) {
      throw new ApiError(401, 'Authentication required: Access token not found in cookie');
    }

    req.accessToken = accessToken;

    next();
  } catch (error) {
    res
      .status(error.status || 500)
      .json(new ApiResponse(error.status || 500, error.message, ERROR_MESSAGE));
  }
};

module.exports = isAuthenticated;
