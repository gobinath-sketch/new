import express from 'express';
import Receivable from '../models/Receivable.js';
import Invoice from '../models/Invoice.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { AuditTrail } from '../models/Governance.js';

const router = express.Router();

router.get('/', authenticate, authorize('Finance Manager', 'Director'), async (req, res) => {
  try {
    const receivables = await Receivable.find().populate('invoiceId').sort({ createdAt: -1 });
    res.json(receivables);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export Receivables Aging Report (Excel) - must be before /:id route
router.get('/export/aging', authenticate, authorize('Finance Manager', 'Director'), async (req, res) => {
  try {
    const receivables = await Receivable.find().sort({ dueDate: 1 });

    const { generateReceivablesExcel } = await import('../utils/excelGenerator.js');
    const workbook = generateReceivablesExcel(receivables);

    const SystemEventLog = (await import('../models/SystemEventLog.js')).default;
    await SystemEventLog.create({
      eventType: 'Report Exported',
      entityType: 'Receivable',
      userId: req.user._id,
      userRole: req.user.role,
      action: 'Exported receivables aging report to Excel'
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Receivables-Aging.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authenticate, authorize('Finance Manager', 'Director'), async (req, res) => {
  try {
    const receivable = await Receivable.findById(req.params.id).populate('invoiceId');
    if (!receivable) {
      return res.status(404).json({ error: 'Receivable not found' });
    }
    res.json(receivable);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticate, authorize('Finance Manager'), async (req, res) => {
  try {
    let receivableData = { ...req.body };

    // Strict Mode: If invoiceId is provided, fetch details from Invoice
    if (req.body.invoiceId) {
      const invoice = await Invoice.findById(req.body.invoiceId);
      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      const dueDate = new Date(invoice.invoiceDate);
      dueDate.setDate(dueDate.getDate() + (req.body.paymentTerms || 30));

      receivableData = {
        ...receivableData,
        invoiceId: invoice._id,
        clientName: invoice.clientName,
        invoiceNumber: invoice.clientInvoiceNumber,
        invoiceAmount: invoice.totalAmount,
        outstandingAmount: invoice.totalAmount,
        dueDate
      };
    } else {
      // Direct Entry Mode (Frontend "Simple Form" support)
      // Ensure separate calculation for dueDate if not from Invoice object
      if (req.body.invoiceDate && !req.body.dueDate) {
        const dDate = new Date(req.body.invoiceDate);
        dDate.setDate(dDate.getDate() + (parseInt(req.body.paymentTerms) || 30));
        receivableData.dueDate = dDate;
      }
      // If standard fields like invoiceNumber are passed in body, they are already in receivableData
    }

    // Ensure adhocId is linked if passed (for GP Dashboard)
    // No strict Opportunity check needed unless we want to enforce it, 
    // but the Frontend sends 'adhocId' as a string.

    const receivable = new Receivable(receivableData);
    await receivable.save();

    await AuditTrail.create({
      action: 'Receivable Created',
      entityType: 'Receivable',
      entityId: receivable._id.toString(),
      userId: req.user._id,
      userRole: req.user.role,
      changes: req.body
    });

    res.status(201).json(receivable);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', authenticate, authorize('Finance Manager'), async (req, res) => {
  try {
    const receivable = await Receivable.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!receivable) {
      return res.status(404).json({ error: 'Receivable not found' });
    }

    res.json(receivable);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
