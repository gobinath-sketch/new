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
    let payableData = { ...req.body };
    let vendorData = null;

    // Strict Mode: Existing Logic via Purchase Order
    if (req.body.purchaseOrderId) {
      const po = await PurchaseOrder.findById(req.body.purchaseOrderId);
      if (!po) return res.status(404).json({ error: 'Purchase Order not found' });

      const vendor = await Vendor.findById(po.vendorId);
      if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

      vendorData = vendor; // Store for TDS
      payableData = {
        ...payableData,
        purchaseOrderId: po._id,
        vendorId: po.vendorId,
        vendorName: vendor.vendorName,
        approvedCost: po.approvedCost,
        adjustedPayableAmount: po.adjustedPayableAmount || po.approvedCost,
        outstandingAmount: po.adjustedPayableAmount || po.approvedCost
      };
    } else {
      // Direct Entry Mode
      // Generate a payout ref if one doesn't exist
      if (!payableData.vendorPayoutReference) {
        const payoutReference = await generateVendorPayoutReference(Payable);
        payableData.vendorPayoutReference = payoutReference;
      }

      // Ensure standard fields if missing
      if (!payableData.adjustedPayableAmount && (payableData.amount || payableData.taxableAmount)) {
        payableData.adjustedPayableAmount = parseFloat(payableData.amount || payableData.taxableAmount);
        payableData.outstandingAmount = payableData.adjustedPayableAmount;
      }

      // Map 'amount' (from simple forms) to 'taxableAmount' so it is saved in DB
      if (!payableData.taxableAmount && payableData.amount) {
        payableData.taxableAmount = parseFloat(payableData.amount);
      }

      // Calculate Due Date
      if (!payableData.dueDate) {
        const dDate = new Date();
        dDate.setDate(dDate.getDate() + (parseInt(req.body.paymentTerms) || 30));
        payableData.dueDate = dDate;
      }
    }

    const payable = new Payable(payableData);
    await payable.save();

    // Auto-calculate TDS only if we have full Vendor Data contexts
    // (Skipping complex AI/TDS for simple Direct Entry to avoid errors, 
    // unless vendorId is passed directly in future)
    let taxRecord = null;
    if (vendorData) {
      // ... (Keep existing TDS Logic) ...
      const currentYear = new Date().getFullYear();
      const vendorYearlyTotal = await getVendorYearlyTotal(Vendor, Payable, vendorData._id, currentYear);

      const { classifyTaxWithAI } = await import('../utils/aiDecisionEngine.js');
      const taxClassification = await classifyTaxWithAI(
        vendorData.vendorType,
        `Payment for services from ${vendorData.vendorName}`,
        payable.adjustedPayableAmount
      );
      const natureOfService = taxClassification.natureOfService;

      const tdsCalculation = await calculateTDS(
        vendorData.vendorType,
        natureOfService,
        payable.adjustedPayableAmount,
        vendorData.panNumber,
        vendorYearlyTotal
      );

      taxRecord = new TaxEngine({
        payableId: payable._id,
        vendorId: vendorData._id,
        vendorType: vendorData.vendorType,
        natureOfService,
        ...tdsCalculation,
        paymentAmount: payable.adjustedPayableAmount,
        panNumber: vendorData.panNumber
      });
      await taxRecord.save();

      // Update payable with net amount
      payable.outstandingAmount = taxRecord.netPayableAmount;
      await payable.save();
    }

    await AuditTrail.create({
      action: 'Payable Created',
      entityType: 'Payable',
      entityId: payable._id.toString(),
      userId: req.user._id,
      userRole: req.user.role,
      changes: req.body
    });

    if (taxRecord) {
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
    }

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
