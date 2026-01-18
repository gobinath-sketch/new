import express from 'express';
import Invoice from '../models/Invoice.js';
import Program from '../models/Program.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { generateInvoiceNumber, generateIRN, generateEwayBill } from '../utils/generators.js';
import { AuditTrail } from '../models/Governance.js';
import Governance from '../models/Governance.js';

const router = express.Router();

router.get('/', authenticate, authorize('Finance Manager', 'Director'), async (req, res) => {
  try {
    const invoices = await Invoice.find().populate('programId dealId').sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download Invoice PDF (must be before /:id route)
router.get('/:id/download', authenticate, authorize('Finance Manager', 'Director'), async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('programId');
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Check if invoice is complete
    if (!invoice.clientInvoiceNumber || !invoice.totalAmount) {
      return res.status(400).json({ error: 'Invoice is incomplete and cannot be downloaded' });
    }

    const { generateInvoicePDF } = await import('../utils/pdfGenerator.js');
    const pdfBuffer = await generateInvoicePDF(invoice.toObject(), req.user.role);

    // Log download
    const SystemEventLog = (await import('../models/SystemEventLog.js')).default;
    await SystemEventLog.create({
      eventType: 'Document Downloaded',
      entityType: 'Invoice',
      entityId: invoice._id.toString(),
      userId: req.user._id,
      userRole: req.user.role,
      action: 'Downloaded invoice PDF'
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Invoice-${invoice.clientInvoiceNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authenticate, authorize('Finance Manager', 'Director'), async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('programId dealId');
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticate, authorize('Finance Manager'), async (req, res) => {
  try {
    const program = await Program.findById(req.body.programId);
    if (!program) {
      return res.status(404).json({ error: 'Program not found' });
    }
    
    if (!program.clientSignOff) {
      return res.status(400).json({ error: 'Client sign-off required before invoice generation' });
    }
    
    const invoiceNumber = await generateInvoiceNumber(Invoice);
    const irnNumber = await generateIRN(Invoice);
    const ewayBillNumber = await generateEwayBill(Invoice);
    
    const invoice = new Invoice({
      ...req.body,
      clientInvoiceNumber: invoiceNumber,
      irnNumber,
      ewayBillNumber,
      invoiceDate: req.body.invoiceDate || new Date()
    });
    await invoice.save();
    
    try {
      const existingInvoices = await Invoice.find({ clientName: invoice.clientName, invoiceAmount: invoice.invoiceAmount });
      if (existingInvoices.length > 1) {
        const governance = await Governance.findOne({ dealId: invoice.dealId }) || new Governance({ dealId: invoice.dealId });
        governance.fraudAlertType = 'Duplicate Invoice';
        governance.duplicateDetectionLog = { invoiceId: invoice._id, similarInvoices: existingInvoices.map(i => i._id) };
        await governance.save();
        
        invoice.duplicateFlag = true;
        await invoice.save();
      }
    } catch (dupError) {
      // Don't fail invoice creation if duplicate detection fails
      console.error('Error in duplicate detection:', dupError.message);
    }
    
    try {
      await AuditTrail.create({
        action: 'Invoice Created',
        entityType: 'Invoice',
        entityId: invoice._id.toString(),
        userId: req.user._id,
        userRole: req.user.role,
        changes: req.body
      });
    } catch (auditError) {
      // Don't fail invoice creation if audit trail fails
      console.error('Error creating audit trail:', auditError.message);
    }
    
    // Auto-post ledger entry (create receivable)
    // Reload invoice first to ensure all calculated fields (totalAmount) are present
    const freshInvoice = await Invoice.findById(invoice._id);
    try {
      const { autoPostLedgerEntry } = await import('../utils/autoGeneration.js');
      await autoPostLedgerEntry(freshInvoice, req.user._id, req.user.role);
    } catch (error) {
      // Log error but don't fail invoice creation
      console.error('Error auto-creating receivable:', error.message);
      // Still continue with invoice creation
    }
    
    try {
      const SystemEventLog = (await import('../models/SystemEventLog.js')).default;
      await SystemEventLog.create({
        eventType: 'Invoice Auto-Generated',
        entityType: 'Invoice',
        entityId: invoice._id.toString(),
        userId: req.user._id,
        userRole: req.user.role,
        action: 'Invoice generated and receivable auto-created',
        downstreamAction: 'Payment tracking active'
      });
    } catch (logError) {
      // Don't fail invoice creation if logging fails
      console.error('Error creating system event log:', logError.message);
    }
    
    res.status(201).json(freshInvoice);
  } catch (error) {
    console.error('Invoice creation error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

router.put('/:id', authenticate, authorize('Finance Manager'), async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
