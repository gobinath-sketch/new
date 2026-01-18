import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  generateInvoiceSummary,
  generatePOSummary,
  generateTaxExplanation,
  generatePaymentSummary,
  generateDealSummary,
  validateDocument
} from '../utils/erpDocumentAssistant.js';
import Invoice from '../models/Invoice.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import TaxEngine from '../models/TaxEngine.js';
import Payable from '../models/Payable.js';
import Deal from '../models/Deal.js';

const router = express.Router();

// Generate Invoice Summary
router.post('/invoice/:id/summary', authenticate, authorize('Finance Manager', 'Director'), async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const summary = await generateInvoiceSummary(invoice.toObject(), req.user.role);
    res.json({ summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate PO Summary
router.post('/purchase-order/:id/summary', authenticate, authorize('Operations Manager', 'Finance Manager', 'Director'), async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id).populate('vendorId dealId');
    if (!po) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    const poData = {
      internalPONumber: po.internalPONumber,
      vendorName: po.vendorId?.vendorName || 'N/A',
      dealId: po.dealId?._id,
      approvedCost: po.approvedCost,
      adjustedPayableAmount: po.adjustedPayableAmount,
      status: po.status,
      costType: po.costType
    };

    const summary = await generatePOSummary(poData, req.user.role);
    res.json({ summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate Tax/TDS Explanation
router.post('/tax/:id/explanation', authenticate, authorize('Finance Manager', 'Director'), async (req, res) => {
  try {
    const taxRecord = await TaxEngine.findById(req.params.id).populate('vendorId payableId');
    if (!taxRecord) {
      return res.status(404).json({ error: 'Tax record not found' });
    }

    const taxData = {
      tdsSection: taxRecord.tdsSection,
      payeeType: taxRecord.payeeType,
      natureOfService: taxRecord.natureOfService,
      applicableTdsPercent: taxRecord.applicableTdsPercent,
      paymentAmount: taxRecord.paymentAmount,
      tdsAmount: taxRecord.tdsAmount,
      netPayableAmount: taxRecord.netPayableAmount,
      thresholdCheckResult: taxRecord.thresholdCheckResult,
      panAvailabilityFlag: taxRecord.panAvailabilityFlag,
      complianceStatus: taxRecord.complianceStatus
    };

    const explanation = await generateTaxExplanation(taxData, req.user.role);
    res.json({ explanation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate Payment Summary
router.post('/payment/:id/summary', authenticate, authorize('Finance Manager', 'Director'), async (req, res) => {
  try {
    const payable = await Payable.findById(req.params.id).populate('vendorId purchaseOrderId');
    if (!payable) {
      return res.status(404).json({ error: 'Payable not found' });
    }

    const paymentData = {
      vendorPayoutReference: payable.vendorPayoutReference,
      vendorName: payable.vendorName,
      adjustedPayableAmount: payable.adjustedPayableAmount,
      outstandingAmount: payable.outstandingAmount,
      status: payable.status,
      dueDate: payable.dueDate,
      paymentTerms: payable.paymentTerms
    };

    const summary = await generatePaymentSummary(paymentData, req.user.role);
    res.json({ summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate Deal Summary
router.post('/deal/:id/summary', authenticate, authorize('Business Head', 'Director'), async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    const summary = await generateDealSummary(deal.toObject(), req.user.role);
    res.json({ summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Validate Document
router.post('/validate/:type', authenticate, authorize('Finance Manager', 'Director'), async (req, res) => {
  try {
    const { type } = req.params;
    const { documentId } = req.body;

    let documentData = null;

    switch (type) {
      case 'invoice':
        const invoice = await Invoice.findById(documentId);
        if (invoice) documentData = invoice.toObject();
        break;
      case 'purchase-order':
        const po = await PurchaseOrder.findById(documentId);
        if (po) documentData = po.toObject();
        break;
      case 'tax':
        const tax = await TaxEngine.findById(documentId);
        if (tax) documentData = tax.toObject();
        break;
      case 'payable':
        const payable = await Payable.findById(documentId);
        if (payable) documentData = payable.toObject();
        break;
      default:
        return res.status(400).json({ error: 'Invalid document type' });
    }

    if (!documentData) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const validation = await validateDocument(type, documentData, req.user.role);
    res.json({ validation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
