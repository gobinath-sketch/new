import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        subRole: user.subRole || null,
        name: user.name,
        avatarDataUrl: user.avatarDataUrl || '',
        settings: user.settings || {},
        downloads: user.downloads || [],
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        subRole: user.subRole || null,
        name: user.name,
        avatarDataUrl: user.avatarDataUrl || '',
        settings: user.settings || {},
        downloads: user.downloads || [],
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    res.status(401).json({ error: 'Authentication failed' });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    if (!token || !process.env.JWT_SECRET) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { name, email } = req.body;

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already in use' });
      }
      user.email = email.toLowerCase().trim();
    }

    if (name) {
      user.name = name.trim();
    }

    user.updatedAt = Date.now();
    await user.save();

    res.json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        subRole: user.subRole || null,
        name: user.name,
        avatarDataUrl: user.avatarDataUrl || '',
        settings: user.settings || {},
        downloads: user.downloads || [],
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Change password
router.put('/change-password', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    if (!token || !process.env.JWT_SECRET) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    user.updatedAt = Date.now();
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    res.status(500).json({ error: error.message });
  }
});

router.get('/settings', authenticate, async (req, res) => {
  res.json({ settings: req.user.settings || {} });
});

router.put('/settings', authenticate, async (req, res) => {
  try {
    const allowedKeys = [
      'emailNotifications',
      'lowGPAlerts',
      'dashboardRefresh',
      'theme',
      'dateFormat',
      'timeZone',
      'autoSave',
      'itemsPerPage',
      'sidebarCompact',
      'denseTables',
      'reduceMotion'
    ];

    const incoming = req.body && typeof req.body === 'object' ? req.body : {};
    const nextSettings = { ...(req.user.settings || {}) };

    for (const key of allowedKeys) {
      if (Object.prototype.hasOwnProperty.call(incoming, key)) {
        nextSettings[key] = incoming[key];
      }
    }

    // Basic validation
    if (typeof nextSettings.dashboardRefresh !== 'undefined') {
      const val = Number(nextSettings.dashboardRefresh);
      if (!Number.isFinite(val) || val < 0) {
        return res.status(400).json({ error: 'Invalid dashboardRefresh value' });
      }
      nextSettings.dashboardRefresh = val;
    }

    if (typeof nextSettings.itemsPerPage !== 'undefined') {
      const val = Number(nextSettings.itemsPerPage);
      if (!Number.isFinite(val) || val < 1) {
        return res.status(400).json({ error: 'Invalid itemsPerPage value' });
      }
      nextSettings.itemsPerPage = val;
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.settings = { ...(user.settings || {}), ...nextSettings };
    user.updatedAt = Date.now();
    await user.save();

    res.json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        subRole: user.subRole || null,
        name: user.name,
        avatarDataUrl: user.avatarDataUrl || '',
        settings: user.settings || {},
        downloads: user.downloads || [],
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      settings: user.settings || {},
      message: 'Settings updated successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/avatar', authenticate, async (req, res) => {
  res.json({ avatarDataUrl: req.user.avatarDataUrl || '' });
});

router.put('/avatar', authenticate, async (req, res) => {
  try {
    const { avatarDataUrl } = req.body || {};
    if (typeof avatarDataUrl !== 'string') {
      return res.status(400).json({ error: 'avatarDataUrl must be a string' });
    }

    // Allow clearing avatar
    const trimmed = avatarDataUrl.trim();
    if (trimmed && !trimmed.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Only image data URLs are supported' });
    }

    // Rough size guard (~3.5MB string)
    if (trimmed.length > 3_500_000) {
      return res.status(400).json({ error: 'Avatar image too large' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.avatarDataUrl = trimmed;
    user.updatedAt = Date.now();
    await user.save();

    res.json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        subRole: user.subRole || null,
        name: user.name,
        avatarDataUrl: user.avatarDataUrl || '',
        settings: user.settings || {},
        downloads: user.downloads || [],
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      avatarDataUrl: user.avatarDataUrl || '',
      message: 'Avatar updated successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/downloads', authenticate, async (req, res) => {
  try {
    const downloads = Array.isArray(req.user.downloads) ? req.user.downloads : [];
    const sorted = [...downloads].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ downloads: sorted });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/downloads', authenticate, async (req, res) => {
  try {
    const { title, type, contentHtml } = req.body || {};

    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'Title is required' });
    }

    if (!type || typeof type !== 'string') {
      return res.status(400).json({ error: 'Type is required' });
    }

    if (!contentHtml || typeof contentHtml !== 'string') {
      return res.status(400).json({ error: 'contentHtml is required' });
    }

    const user = req.user;
    if (!Array.isArray(user.downloads)) user.downloads = [];

    user.downloads.unshift({
      title: title.trim().slice(0, 140),
      type: type.trim().slice(0, 64),
      contentHtml,
      createdAt: new Date()
    });

    user.downloads = user.downloads.slice(0, 50);
    await user.save();

    res.json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        subRole: user.subRole || null,
        name: user.name,
        avatarDataUrl: user.avatarDataUrl || '',
        settings: user.settings || {},
        downloads: user.downloads || [],
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      message: 'Saved to downloads history'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/downloads/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const before = Array.isArray(user.downloads) ? user.downloads.length : 0;
    user.downloads = (Array.isArray(user.downloads) ? user.downloads : []).filter((d) => String(d._id) !== String(id));
    const after = user.downloads.length;

    if (before === after) {
      return res.status(404).json({ error: 'Download not found' });
    }

    user.updatedAt = Date.now();
    await user.save();

    res.json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        subRole: user.subRole || null,
        name: user.name,
        avatarDataUrl: user.avatarDataUrl || '',
        settings: user.settings || {},
        downloads: user.downloads || [],
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      message: 'Download removed'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
