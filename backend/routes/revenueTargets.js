import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import RevenueTarget from '../models/RevenueTarget.js';

const router = express.Router();

// Get revenue targets (all roles can view)
router.get('/', authenticate, async (req, res) => {
  try {
    const { year, period } = req.query;
    const currentYear = year || new Date().getFullYear();
    
    const filter = { year: parseInt(currentYear) };
    if (period) {
      filter.period = period;
    }
    
    const targets = await RevenueTarget.find(filter)
      .populate('setBy', 'name email role')
      .sort({ period: 1, quarter: 1, createdAt: -1 });
    
    res.json(targets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current revenue target for a specific period (for dashboards)
router.get('/current', authenticate, async (req, res) => {
  try {
    const { period, quarter, year } = req.query;
    const currentYear = year || new Date().getFullYear();
    
    const filter = { year: parseInt(currentYear) };
    
    // Determine period if not provided
    if (!period) {
      const currentMonth = new Date().getMonth() + 1;
      const currentQuarter = Math.ceil(currentMonth / 3);
      if (quarter || currentQuarter) {
        filter.period = 'Quarterly';
        filter.quarter = parseInt(quarter || currentQuarter);
      } else if (currentMonth <= 6) {
        filter.period = 'H1';
      } else {
        filter.period = 'H2';
      }
    } else {
      filter.period = period;
      if (period === 'Quarterly') {
        if (quarter) {
          filter.quarter = parseInt(quarter);
        } else {
          const currentMonth = new Date().getMonth() + 1;
          filter.quarter = Math.ceil(currentMonth / 3);
        }
      }
    }
    
    const target = await RevenueTarget.findOne(filter)
      .populate('setBy', 'name email role')
      .sort({ createdAt: -1 });
    
    res.json(target || { amount: 0, period: filter.period, quarter: filter.quarter, year: currentYear });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set/Update revenue target (Director only)
router.post('/', authenticate, authorize('Director'), async (req, res) => {
  try {
    const { year, period, quarter, amount } = req.body;
    
    if (!year || !period || !amount) {
      return res.status(400).json({ error: 'Year, period, and amount are required' });
    }
    
    if (period === 'Quarterly' && !quarter) {
      return res.status(400).json({ error: 'Quarter is required for Quarterly period' });
    }
    
    if (period === 'Quarterly' && (quarter < 1 || quarter > 4)) {
      return res.status(400).json({ error: 'Quarter must be between 1 and 4' });
    }
    
    const filter = { year: parseInt(year), period };
    if (period === 'Quarterly') {
      filter.quarter = parseInt(quarter);
    } else {
      filter.quarter = null;
    }
    
    // Upsert - update if exists, create if not
    const target = await RevenueTarget.findOneAndUpdate(
      filter,
      {
        amount: parseFloat(amount),
        setBy: req.user._id,
        setAt: new Date(),
        updatedAt: new Date()
      },
      {
        new: true,
        upsert: true
      }
    ).populate('setBy', 'name email role');
    
    res.json({ message: 'Revenue target set successfully', target });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'A target for this period already exists. Use PUT to update.' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update revenue target (Director only)
router.put('/:id', authenticate, authorize('Director'), async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount < 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }
    
    const target = await RevenueTarget.findByIdAndUpdate(
      req.params.id,
      {
        amount: parseFloat(amount),
        setBy: req.user._id,
        setAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    ).populate('setBy', 'name email role');
    
    if (!target) {
      return res.status(404).json({ error: 'Revenue target not found' });
    }
    
    res.json({ message: 'Revenue target updated successfully', target });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete revenue target (Director only)
router.delete('/:id', authenticate, authorize('Director'), async (req, res) => {
  try {
    const target = await RevenueTarget.findByIdAndDelete(req.params.id);
    
    if (!target) {
      return res.status(404).json({ error: 'Revenue target not found' });
    }
    
    res.json({ message: 'Revenue target deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
