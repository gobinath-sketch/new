import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all notifications for current user
router.get('/', authenticate, authorize('Sales Executive', 'Sales Manager', 'Business Head', 'Director', 'Operations Manager', 'Finance Manager'), async (req, res) => {
  try {
    const Notification = (await import('../models/Notification.js')).default;
    
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const notifications = await Notification.find({ userId: req.user._id })
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({ 
      userId: req.user._id, 
      read: false 
    });

    res.json({
      notifications: notifications || [],
      unreadCount: unreadCount || 0
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.put('/:id/read', authenticate, authorize('Sales Executive', 'Sales Manager', 'Business Head', 'Director', 'Operations Manager', 'Finance Manager'), async (req, res) => {
  try {
    const Notification = (await import('../models/Notification.js')).default;
    
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark all notifications as read
router.put('/read-all', authenticate, authorize('Sales Executive', 'Sales Manager', 'Business Head', 'Director', 'Operations Manager', 'Finance Manager'), async (req, res) => {
  try {
    const Notification = (await import('../models/Notification.js')).default;
    
    await Notification.updateMany(
      { userId: req.user._id, read: false },
      { read: true, readAt: new Date() }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get unread count
router.get('/unread-count', authenticate, authorize('Sales Executive', 'Sales Manager', 'Business Head', 'Director', 'Operations Manager', 'Finance Manager'), async (req, res) => {
  try {
    const Notification = (await import('../models/Notification.js')).default;
    
    const unreadCount = await Notification.countDocuments({ 
      userId: req.user._id, 
      read: false 
    });

    res.json({ unreadCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
