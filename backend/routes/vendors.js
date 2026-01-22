import express from 'express';
import Vendor from '../models/Vendor.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { AuditTrail } from '../models/Governance.js';

const router = express.Router();

router.get('/', authenticate, authorize('Operations Manager', 'Finance Manager', 'Director', 'Sales Executive', 'Sales Manager'), async (req, res) => {
  try {
    const vendors = await Vendor.find().sort({ createdAt: -1 });
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authenticate, authorize('Operations Manager', 'Finance Manager', 'Director'), async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    res.json(vendor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticate, authorize('Operations Manager'), async (req, res) => {
  try {
    const vendor = new Vendor(req.body);
    await vendor.save();

    await AuditTrail.create({
      action: 'Vendor Created',
      entityType: 'Vendor',
      entityId: vendor._id.toString(),
      userId: req.user._id,
      userRole: req.user.role,
      changes: req.body
    });

    res.status(201).json(vendor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', authenticate, authorize('Operations Manager'), async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    await AuditTrail.create({
      action: 'Vendor Updated',
      entityType: 'Vendor',
      entityId: vendor._id.toString(),
      userId: req.user._id,
      userRole: req.user.role,
      changes: req.body
    });

    res.json(vendor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authenticate, authorize('Operations Manager'), async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndDelete(req.params.id);
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    await AuditTrail.create({
      action: 'Vendor Deleted',
      entityType: 'Vendor',
      entityId: req.params.id,
      userId: req.user._id,
      userRole: req.user.role,
      changes: {}
    });

    res.json({ message: 'Vendor deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
