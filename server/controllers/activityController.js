const db = require('../data/database');

exports.getActivities = (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 25;
    const activities = db.getActivities(limit);
    return res.json({
      success: true,
      activities
    });
  } catch (err) {
    console.error('Error fetching activities:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving activities.' });
  }
};
