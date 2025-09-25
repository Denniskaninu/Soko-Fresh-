const { Notification } = require('../models');

// Get user's notifications
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const notifications = await Notification.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      limit: 50
    });
    
    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
};

// Mark notifications as read
const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notification_ids } = req.body;
    
    if (!notification_ids || !Array.isArray(notification_ids)) {
      return res.status(400).json({
        success: false,
        message: 'notification_ids must be an array'
      });
    }
    
    await Notification.update(
      { is_read: true },
      {
        where: {
          id: notification_ids,
          user_id: userId
        }
      }
    );
    
    res.json({
      success: true,
      message: 'Notifications marked as read'
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notifications'
    });
  }
};

// Get unread notification count
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const count = await Notification.count({
      where: {
        user_id: userId,
        is_read: false
      }
    });
    
    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count'
    });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  getUnreadCount
};
