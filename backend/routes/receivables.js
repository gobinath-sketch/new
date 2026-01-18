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
    const invoice = await Invoice.findById(req.body.invoiceId);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    const dueDate = new Date(invoice.invoiceDate);
    dueDate.setDate(dueDate.getDate() + (req.body.paymentTerms || 30));
    
    const receivable = new Receivable({
      ...req.body,
      invoiceId: invoice._id,
      clientName: invoice.clientName,
      invoiceNumber: invoice.clientInvoiceNumber,
      invoiceAmount: invoice.totalAmount,
      outstandingAmount: invoice.totalAmount,
      dueDate
    });
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
