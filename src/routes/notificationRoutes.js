const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  getUnreadCount
} = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware
router.use(authenticateToken);

// Notification routes
router.get('/', getNotifications);
router.post('/read', markAsRead);
router.get('/unread-count', getUnreadCount);

module.exports = router;
