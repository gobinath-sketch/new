import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

router.post('/', authenticate, authorize('Director', 'Sales Manager'), async (req, res) => {
  try {
    const { userId, year, period, amount } = req.body || {};

    if (!userId || !year || !period || amount === undefined || amount === null) {
      return res.status(400).json({ error: 'userId, year, period, amount are required' });
    }

    const yearInt = Number(year);
    const amountNum = Number(amount);
    if (!Number.isFinite(yearInt) || !Number.isFinite(amountNum)) {
      return res.status(400).json({ error: 'year and amount must be valid numbers' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.targets = Array.isArray(user.targets) ? user.targets : [];

    const idx = user.targets.findIndex(t => Number(t.year) === yearInt && String(t.period) === String(period));
    if (idx >= 0) user.targets[idx].amount = amountNum;
    else user.targets.push({ year: yearInt, period: String(period), amount: amountNum });

    await user.save();
    res.json({ message: 'Target updated successfully', targets: user.targets });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to update targets' });
  }
});

router.get('/:userId', authenticate, authorize('Director', 'Sales Manager', 'Sales Executive', 'Business Head', 'Finance Manager', 'Operations Manager'), async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user?.role === 'Sales Executive' && String(req.user._id) !== String(userId)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const user = await User.findById(userId).select('targets name role');
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json(user.targets || []);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to fetch targets' });
  }
});

export default router;
