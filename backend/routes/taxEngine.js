import express from 'express';
import TaxEngine from '../models/TaxEngine.js';
import Payable from '../models/Payable.js';
import Vendor from '../models/Vendor.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { calculateTDS, getVendorYearlyTotal } from '../utils/tdsCalculator.js';
import SystemEventLog from '../models/SystemEventLog.js';

const router = express.Router();

// Auto-calculate TDS for a payable (Finance only)
router.post('/calculate/:payableId', authenticate, authorize('Finance Manager'), async (req, res) => {
  try {
    const payable = await Payable.findById(req.params.payableId).populate('vendorId');
    if (!payable) {
      return res.status(404).json({ error: 'Payable not found' });
    }

    const vendor = await Vendor.findById(payable.vendorId);
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    // Get vendor yearly total
    const currentYear = new Date().getFullYear();
    const vendorYearlyTotal = await getVendorYearlyTotal(Vendor, Payable, vendor._id, currentYear);

    // Use AI to classify nature of service
    const { classifyTaxWithAI } = await import('../utils/aiDecisionEngine.js');
    const taxClassification = await classifyTaxWithAI(
      vendor.vendorType,
      `Payment for services from ${vendor.vendorName}`,
      payable.adjustedPayableAmount
    );
    const natureOfService = taxClassification.natureOfService;
    
    // Map vendor type for TDS calculation
    let vendorTypeForTDS = vendor.vendorType;
    if (vendor.vendorType === 'Company') {
      vendorTypeForTDS = 'Company';
    }

    // Calculate TDS
    const tdsCalculation = await calculateTDS(
      vendorTypeForTDS,
      natureOfService,
      payable.adjustedPayableAmount,
      vendor.panNumber,
      vendorYearlyTotal
    );

    // Check if tax record exists
    let taxRecord = await TaxEngine.findOne({ payableId: payable._id });
    
    if (taxRecord) {
      // Update existing
      Object.assign(taxRecord, {
        vendorType: vendorTypeForTDS,
        natureOfService,
        ...tdsCalculation,
        paymentAmount: payable.adjustedPayableAmount,
        panNumber: vendor.panNumber
      });
      await taxRecord.save();
    } else {
      // Create new
      taxRecord = new TaxEngine({
        payableId: payable._id,
        vendorId: vendor._id,
        vendorType: vendorTypeForTDS,
        natureOfService,
        ...tdsCalculation,
        paymentAmount: payable.adjustedPayableAmount,
        panNumber: vendor.panNumber
      });
      await taxRecord.save();
    }

    // Update payable with TDS amount
    payable.outstandingAmount = taxRecord.netPayableAmount;
    await payable.save();

    await SystemEventLog.create({
      eventType: 'TDS Calculated',
      entityType: 'TaxEngine',
      entityId: taxRecord._id.toString(),
      userId: req.user._id,
      userRole: req.user.role,
      action: 'Auto-calculated TDS',
      metadata: {
        tdsSection: taxRecord.tdsSection,
        tdsAmount: taxRecord.tdsAmount,
        complianceStatus: taxRecord.complianceStatus
      }
    });

    res.json(taxRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get TDS records (Finance, Director)
router.get('/', authenticate, authorize('Finance Manager', 'Director'), async (req, res) => {
  try {
    const taxRecords = await TaxEngine.find()
      .populate('vendorId', 'vendorName panNumber vendorType')
      .populate('payableId')
      .populate('directorOverrideBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(taxRecords);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download Tax/TDS PDF (must be before /:id route)
router.get('/:id/download', authenticate, authorize('Finance Manager', 'Director'), async (req, res) => {
  try {
    const taxRecord = await TaxEngine.findById(req.params.id).populate('vendorId payableId');
    if (!taxRecord) {
      return res.status(404).json({ error: 'Tax record not found' });
    }

    if (!taxRecord.tdsSection || taxRecord.paymentAmount === undefined) {
      return res.status(400).json({ error: 'Tax record is incomplete and cannot be downloaded' });
    }

    const { generateTaxPDF } = await import('../utils/pdfGenerator.js');
    const pdfBuffer = await generateTaxPDF(taxRecord.toObject(), req.user.role);

    const SystemEventLog = (await import('../models/SystemEventLog.js')).default;
    await SystemEventLog.create({
      eventType: 'Document Downloaded',
      entityType: 'TaxEngine',
      entityId: taxRecord._id.toString(),
      userId: req.user._id,
      userRole: req.user.role,
      action: 'Downloaded tax summary PDF'
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="TDS-${taxRecord.tdsSection}-${taxRecord._id}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get TDS record by ID
router.get('/:id', authenticate, authorize('Finance Manager', 'Director'), async (req, res) => {
  try {
    const taxRecord = await TaxEngine.findById(req.params.id)
      .populate('vendorId', 'vendorName panNumber vendorType')
      .populate('payableId')
      .populate('directorOverrideBy', 'name email');
    if (!taxRecord) {
      return res.status(404).json({ error: 'TDS record not found' });
    }
    res.json(taxRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Director override for PAN not provided
router.put('/:id/override', authenticate, authorize('Director'), async (req, res) => {
  try {
    const taxRecord = await TaxEngine.findById(req.params.id);
    if (!taxRecord) {
      return res.status(404).json({ error: 'TDS record not found' });
    }

    taxRecord.directorOverrideFlag = true;
    taxRecord.directorOverrideBy = req.user._id;
    taxRecord.directorOverrideAt = new Date();
    taxRecord.complianceStatus = 'Director Override';
    
    // Recalculate without PAN penalty
    const vendor = await Vendor.findById(taxRecord.vendorId);
    const payable = await Payable.findById(taxRecord.payableId);
    const currentYear = new Date().getFullYear();
    const vendorYearlyTotal = await getVendorYearlyTotal(Vendor, Payable, vendor._id, currentYear);
    
    const tdsCalculation = await calculateTDS(
      vendor.vendorType,
      taxRecord.natureOfService,
      payable.adjustedPayableAmount,
      'OVERRIDE', // Fake PAN to bypass check
      vendorYearlyTotal
    );
    
    taxRecord.applicableTdsPercent = tdsCalculation.applicableTdsPercent;
    taxRecord.tdsAmount = tdsCalculation.tdsAmount;
    taxRecord.netPayableAmount = tdsCalculation.netPayableAmount;
    
    await taxRecord.save();

    await SystemEventLog.create({
      eventType: 'TDS Calculated',
      entityType: 'TaxEngine',
      entityId: taxRecord._id.toString(),
      userId: req.user._id,
      userRole: req.user.role,
      action: 'Director override for PAN not provided',
      metadata: { overrideReason: req.body.reason }
    });

    res.json(taxRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get payment status (read-only for Ops)
router.get('/payment-status/:vendorId', authenticate, authorize('Operations Manager'), async (req, res) => {
  try {
    const payables = await Payable.find({ vendorId: req.params.vendorId })
      .select('status outstandingAmount vendorPayoutReference')
      .sort({ createdAt: -1 });
    
    res.json({
      vendorId: req.params.vendorId,
      payables: payables.map(p => ({
        status: p.status,
        outstandingAmount: p.outstandingAmount,
        reference: p.vendorPayoutReference
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
