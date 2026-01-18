import express from 'express';
import Payable from '../models/Payable.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import Vendor from '../models/Vendor.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { generateVendorPayoutReference } from '../utils/generators.js';
import { AuditTrail } from '../models/Governance.js';
import TaxEngine from '../models/TaxEngine.js';
import { calculateTDS, getVendorYearlyTotal } from '../utils/tdsCalculator.js';
import SystemEventLog from '../models/SystemEventLog.js';

const router = express.Router();

router.get('/', authenticate, authorize('Finance Manager', 'Director'), async (req, res) => {
  try {
    const payables = await Payable.find().populate('purchaseOrderId vendorId').sort({ createdAt: -1 });
    res.json(payables);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export Payables Report (Excel) - must be before /:id route
router.get('/export/excel', authenticate, authorize('Finance Manager', 'Director'), async (req, res) => {
  try {
    const payables = await Payable.find().populate('vendorId').sort({ createdAt: -1 });
    
    const { generatePayablesExcel } = await import('../utils/excelGenerator.js');
    const workbook = generatePayablesExcel(payables);

    const SystemEventLog = (await import('../models/SystemEventLog.js')).default;
    await SystemEventLog.create({
      eventType: 'Report Exported',
      entityType: 'Payable',
      userId: req.user._id,
      userRole: req.user.role,
      action: 'Exported payables report to Excel'
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Payables-Report.xlsx"');
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download Payment Summary PDF (must be before /:id route)
router.get('/:id/download', authenticate, authorize('Finance Manager', 'Director'), async (req, res) => {
  try {
    const payable = await Payable.findById(req.params.id).populate('vendorId purchaseOrderId');
    if (!payable) {
      return res.status(404).json({ error: 'Payable not found' });
    }

    if (!payable.vendorPayoutReference || payable.adjustedPayableAmount === undefined) {
      return res.status(400).json({ error: 'Payable is incomplete and cannot be downloaded' });
    }

    const { generatePaymentPDF } = await import('../utils/pdfGenerator.js');
    const pdfBuffer = await generatePaymentPDF(payable.toObject(), req.user.role);

    const SystemEventLog = (await import('../models/SystemEventLog.js')).default;
    await SystemEventLog.create({
      eventType: 'Document Downloaded',
      entityType: 'Payable',
      entityId: payable._id.toString(),
      userId: req.user._id,
      userRole: req.user.role,
      action: 'Downloaded payment summary PDF'
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Payment-${payable.vendorPayoutReference}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authenticate, authorize('Finance Manager', 'Director'), async (req, res) => {
  try {
    const payable = await Payable.findById(req.params.id).populate('purchaseOrderId vendorId');
    if (!payable) {
      return res.status(404).json({ error: 'Payable not found' });
    }
    res.json(payable);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticate, authorize('Finance Manager'), async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.body.purchaseOrderId);
    if (!po) {
      return res.status(404).json({ error: 'Purchase Order not found' });
    }
    
    const vendor = await Vendor.findById(po.vendorId);
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    
    const payoutReference = await generateVendorPayoutReference(Payable);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (req.body.paymentTerms || 30));
    
    const payable = new Payable({
      ...req.body,
      purchaseOrderId: po._id,
      vendorId: po.vendorId,
      vendorName: vendor.vendorName,
      vendorPayoutReference: payoutReference,
      approvedCost: po.approvedCost,
      adjustedPayableAmount: po.adjustedPayableAmount || po.approvedCost,
      outstandingAmount: po.adjustedPayableAmount || po.approvedCost,
      dueDate
    });
    await payable.save();
    
    // Auto-calculate TDS
    const currentYear = new Date().getFullYear();
    const vendorYearlyTotal = await getVendorYearlyTotal(Vendor, Payable, vendor._id, currentYear);
    
    // Use AI to classify nature of service
    const { classifyTaxWithAI } = await import('../utils/aiDecisionEngine.js');
    const taxClassification = await classifyTaxWithAI(
      vendor.vendorType,
      `Payment for ${po.costType || 'services'} from ${vendor.vendorName}`,
      payable.adjustedPayableAmount
    );
    const natureOfService = taxClassification.natureOfService;
    
    // Use vendor type as-is for AI TDS calculation
    const vendorTypeForTDS = vendor.vendorType;
    
    const tdsCalculation = await calculateTDS(
      vendorTypeForTDS,
      natureOfService,
      payable.adjustedPayableAmount,
      vendor.panNumber,
      vendorYearlyTotal
    );
    
    const taxRecord = new TaxEngine({
      payableId: payable._id,
      vendorId: vendor._id,
      vendorType: vendorTypeForTDS,
      natureOfService,
      ...tdsCalculation,
      paymentAmount: payable.adjustedPayableAmount,
      panNumber: vendor.panNumber
    });
    await taxRecord.save();
    
    // Update payable with net amount after TDS
    payable.outstandingAmount = taxRecord.netPayableAmount;
    await payable.save();
    
    await AuditTrail.create({
      action: 'Payable Created',
      entityType: 'Payable',
      entityId: payable._id.toString(),
      userId: req.user._id,
      userRole: req.user.role,
      changes: req.body
    });
    
    await SystemEventLog.create({
      eventType: 'TDS Calculated',
      entityType: 'Payable',
      entityId: payable._id.toString(),
      userId: req.user._id,
      userRole: req.user.role,
      action: 'Auto-calculated TDS on payable creation',
      downstreamAction: 'Compliance log updated',
      metadata: {
        tdsSection: taxRecord.tdsSection,
        tdsAmount: taxRecord.tdsAmount
      }
    });
    
    res.status(201).json({ payable, taxRecord });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', authenticate, authorize('Finance Manager'), async (req, res) => {
  try {
    const payable = await Payable.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!payable) {
      return res.status(404).json({ error: 'Payable not found' });
    }
    
    res.json(payable);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
