import express from 'express';
import Material from '../models/Material.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { AuditTrail } from '../models/Governance.js';

const router = express.Router();

router.get('/', authenticate, authorize('Operations Manager', 'Finance Manager'), async (req, res) => {
  try {
    const materials = await Material.find().populate('programId').sort({ createdAt: -1 });
    res.json(materials);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authenticate, authorize('Operations Manager', 'Finance Manager'), async (req, res) => {
  try {
    const material = await Material.findById(req.params.id).populate('programId');
    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }
    res.json(material);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticate, authorize('Operations Manager'), async (req, res) => {
  try {
    const material = new Material(req.body);
    await material.save();
    
    await AuditTrail.create({
      action: 'Material Created',
      entityType: 'Material',
      entityId: material._id.toString(),
      userId: req.user._id,
      userRole: req.user.role,
      changes: req.body
    });
    
    res.status(201).json(material);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', authenticate, authorize('Operations Manager'), async (req, res) => {
  try {
    const material = await Material.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }
    
    res.json(material);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
