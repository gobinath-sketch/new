import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Authentication required', header: req.headers.authorization });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ error: 'User not found', id: decoded.userId });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token', details: error.message, stack: error.stack });
  }
};

// Helper function to check if user has required role
const hasAccess = (user, allowedRoles) => {
  const userRole = user.role;

  // Check direct role match
  if (allowedRoles.includes(userRole)) {
    return true;
  }

  return false;
};

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!hasAccess(req.user, allowedRoles)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    next();
  };
};
