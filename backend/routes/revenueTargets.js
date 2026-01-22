import express from 'express';
import RevenueTarget from '../models/RevenueTarget.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/revenue-targets
 * @desc    Get revenue targets (Optional: filter by year)
 * @access  Private (Director, Business Head, Sales Executive, Sales Manager)
 */
router.get('/', authenticate, authorize('Director', 'Business Head', 'Sales Executive', 'Sales Manager'), async (req, res) => {
  try {
    const { year } = req.query;
    const query = year ? { year } : {};

    const targets = await RevenueTarget.find(query).sort({ year: 1, quarter: 1 });
    res.json(targets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/revenue-targets
 * @desc    Create or Update a revenue target
 * @access  Private (Director only)
 * @body    { year, period, quarter, amount }
 */
router.post('/', authenticate, authorize('Director'), async (req, res) => {
  try {
    const { year, period, quarter, amount } = req.body;

    // Validation
    if (!year || !period || !amount) {
      return res.status(400).json({ error: 'Please provide year, period, and amount' });
    }

    if (period === 'Quarterly' && !quarter) {
      return res.status(400).json({ error: 'Quarter is required for Quarterly period' });
    }

    // Upsert: Update if exists, Create if new
    const filter = { year, period };
    if (quarter) filter.quarter = quarter;

    const target = await RevenueTarget.findOneAndUpdate(
      filter,
      {
        year,
        period,
        quarter,
        amount,
        setBy: req.user._id,
        updatedAt: Date.now()
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.json(target);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
