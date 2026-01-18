import express from 'express';
import BOC from '../models/BOC.js';
import PurchaseOffer from '../models/PurchaseOffer.js';
import Invoice from '../models/Invoice.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { AuditTrail } from '../models/Governance.js';

const router = express.Router();

// Get all BOCs
router.get('/', authenticate, authorize('Sales Executive', 'Sales Manager', 'Operations Manager', 'Business Head', 'Director', 'Finance Manager'), async (req, res) => {
  try {
    const userRole = req.user.role;
    let filter = {};

    // Sales Executive and Sales Manager see BOCs they created
    if (userRole === 'Sales Executive' || userRole === 'Sales Manager') {
      filter.createdBy = req.user._id;
    }

    const bocs = await BOC.find(filter)
      .populate('purchaseOfferId', 'offerNumber offerValue')
      .populate('quotationId', 'quotationNumber totalValue')
      .populate('clientId', 'clientName trainingSector')
      .populate('createdBy', 'name email')
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(bocs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single BOC
router.get('/:id', authenticate, authorize('Sales Executive', 'Sales Manager', 'Operations Manager', 'Business Head', 'Director', 'Finance Manager'), async (req, res) => {
  try {
    const boc = await BOC.findById(req.params.id)
      .populate('purchaseOfferId', 'offerNumber offerValue terms')
      .populate('quotationId', 'quotationNumber totalValue serviceDescription')
      .populate('clientId', 'clientName trainingSector contactPersonName emailId')
      .populate('createdBy', 'name email')
      .populate('uploadedBy', 'name email')
      .populate('invoiceId', 'clientInvoiceNumber totalAmount');

    if (!boc) {
      return res.status(404).json({ error: 'BOC not found' });
    }

    res.json(boc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload BOC document (Sales Executive or Sales Manager)
router.post('/:id/upload', authenticate, authorize('Sales Executive', 'Sales Manager'), async (req, res) => {
  try {
    const boc = await BOC.findById(req.params.id);
    
    if (!boc) {
      return res.status(404).json({ error: 'BOC not found' });
    }

    // In production, handle file upload here
    // For now, accept file path/URL from request
    boc.documentUpload = req.body.documentPath || req.body.documentUrl;
    boc.uploadedBy = req.user._id;
    boc.uploadedAt = new Date();
    boc.status = 'Uploaded';
    await boc.save();

    await AuditTrail.create({
      action: 'BOC Document Uploaded',
      entityType: 'BOC',
      entityId: boc._id.toString(),
      userId: req.user._id,
      userRole: req.user.role,
      changes: { documentUpload: boc.documentUpload }
    });

    res.json(boc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send BOC to Operations and Finance
router.post('/:id/send-to-ops-finance', authenticate, authorize('Sales Executive', 'Sales Manager'), async (req, res) => {
  try {
    const boc = await BOC.findById(req.params.id);
    
    if (!boc) {
      return res.status(404).json({ error: 'BOC not found' });
    }

    if (!boc.documentUpload) {
      return res.status(400).json({ error: 'BOC document must be uploaded first' });
    }

    boc.sentToOperations = true;
    boc.sentToFinance = true;
    boc.sentToOperationsAt = new Date();
    boc.sentToFinanceAt = new Date();
    boc.status = 'Sent to Operations';
    await boc.save();

    await AuditTrail.create({
      action: 'BOC Sent to Operations and Finance',
      entityType: 'BOC',
      entityId: boc._id.toString(),
      userId: req.user._id,
      userRole: req.user.role,
      changes: { sentToOperations: true, sentToFinance: true }
    });

    res.json(boc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create invoice from BOC (Operations Manager or Finance Manager)
router.post('/:id/create-invoice', authenticate, authorize('Operations Manager', 'Finance Manager'), async (req, res) => {
  try {
    const boc = await BOC.findById(req.params.id);
    
    if (!boc) {
      return res.status(404).json({ error: 'BOC not found' });
    }

    if (boc.convertedToInvoice) {
      return res.status(400).json({ error: 'Invoice already created from this BOC' });
    }

    const { generateInvoiceNumber } = await import('../utils/generators.js');
    const invoiceNumber = await generateInvoiceNumber(Invoice);

    const invoice = new Invoice({
      clientInvoiceNumber: invoiceNumber,
      clientName: boc.clientName,
      invoiceAmount: boc.confirmedValue,
      invoiceDate: new Date(),
      gstType: req.body.gstType || 'IGST',
      gstPercent: req.body.gstPercent || 18,
      sacCode: req.body.sacCode || '998314',
      bocId: boc._id,
      status: 'Generated',
      ...req.body
    });

    // Calculate GST and total
    const gstAmount = (invoice.invoiceAmount * invoice.gstPercent) / 100;
    invoice.taxAmount = gstAmount;
    invoice.totalAmount = invoice.invoiceAmount + gstAmount;

    await invoice.save();

    boc.convertedToInvoice = true;
    boc.invoiceId = invoice._id;
    boc.status = 'Invoice Generated';
    await boc.save();

    await AuditTrail.create({
      action: 'Invoice Created from BOC',
      entityType: 'Invoice',
      entityId: invoice._id.toString(),
      userId: req.user._id,
      userRole: req.user.role,
      changes: { bocId: boc._id.toString() }
    });

    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
