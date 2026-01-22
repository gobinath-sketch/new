import express from 'express';
import PurchaseOrder from '../models/PurchaseOrder.js';
import Deal from '../models/Deal.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { generatePONumber } from '../utils/generators.js';
import { AuditTrail } from '../models/Governance.js';

const router = express.Router();

router.get('/', authenticate, authorize('Operations Manager', 'Finance Manager'), async (req, res) => {
  try {
    const pos = await PurchaseOrder.find().populate('vendorId programId dealId').sort({ createdAt: -1 });
    res.json(pos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download PO PDF (must be before /:id route)
router.get('/:id/download', authenticate, authorize('Operations Manager', 'Finance Manager', 'Director'), async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id).populate('vendorId dealId');
    if (!po) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    if (!po.internalPONumber || !po.approvedCost) {
      return res.status(400).json({ error: 'Purchase order is incomplete and cannot be downloaded' });
    }

    const poData = {
      ...po.toObject(),
      vendorName: po.vendorId?.vendorName || po.vendorName
    };

    const { generatePOPDF } = await import('../utils/pdfGenerator.js');
    const pdfBuffer = await generatePOPDF(poData, req.user.role);

    const SystemEventLog = (await import('../models/SystemEventLog.js')).default;
    await SystemEventLog.create({
      eventType: 'Document Downloaded',
      entityType: 'PurchaseOrder',
      entityId: po._id.toString(),
      userId: req.user._id,
      userRole: req.user.role,
      action: 'Downloaded PO PDF'
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="PO-${po.internalPONumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authenticate, authorize('Operations Manager', 'Finance Manager'), async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id).populate('vendorId programId dealId');
    if (!po) {
      return res.status(404).json({ error: 'Purchase Order not found' });
    }
    res.json(po);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticate, authorize('Operations Manager'), async (req, res) => {
  try {
    const poNumber = await generatePONumber(PurchaseOrder);
    
    const deal = await Deal.findById(req.body.dealId);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    
    if (deal.approvalStatus !== 'Approved') {
      return res.status(400).json({ error: 'Deal must be approved before creating PO' });
    }
    
    const po = new PurchaseOrder({
      ...req.body,
      internalPONumber: poNumber,
      approvedCost: req.body.approvedCost || 0
    });
    await po.save();
    
    await AuditTrail.create({
      action: 'Purchase Order Created',
      entityType: 'PurchaseOrder',
      entityId: po._id.toString(),
      userId: req.user._id,
      userRole: req.user.role,
      changes: req.body
    });
    
    res.status(201).json(po);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', authenticate, authorize('Operations Manager', 'Finance Manager'), async (req, res) => {
  try {
    const po = await PurchaseOrder.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!po) {
      return res.status(404).json({ error: 'Purchase Order not found' });
    }
    
    res.json(po);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
