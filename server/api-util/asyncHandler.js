exports.asyncHandler = requestHandler => async (req, res, next) => {
  try {
    await requestHandler(req, res, next);
  } catch (error) {
    // Only use error.code if it's a valid HTTP status code (number between 400 and 599)
    const status = (typeof error.code === 'number' && error.code >= 400 && error.code < 600) ? error.code : 500;
    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};
