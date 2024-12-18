module.exports = async (req, res) => {
  try {
    const fileURL = req.fileUrls ? req.fileUrls : '';
    return res
      .status(200)
      .set('Content-Type', 'application/json')
      .json(fileURL)
      .end();
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
