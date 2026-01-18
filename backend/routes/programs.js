import express from 'express';
import Program from '../models/Program.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { generateProgramCode } from '../utils/generators.js';
import { AuditTrail } from '../models/Governance.js';

const router = express.Router();

router.get('/', authenticate, authorize('Operations Manager'), async (req, res) => {
  try {
    const programs = await Program.find().populate('primaryTrainer backupTrainer').sort({ createdAt: -1 });
    res.json(programs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authenticate, authorize('Operations Manager', 'Business Head', 'Director', 'Finance Manager', 'Sales Executive', 'Sales Manager'), async (req, res) => {
  try {
    const program = await Program.findById(req.params.id)
      .populate('primaryTrainer backupTrainer')
      .populate({
        path: 'opportunityId',
        select: 'opportunityId billingClient endClient courseName courseCode'
      });
    if (!program) {
      return res.status(404).json({ error: 'Program not found' });
    }
    res.json(program);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticate, authorize('Operations Manager'), async (req, res) => {
  try {
    const programCode = await generateProgramCode(Program);
    const program = new Program({ ...req.body, programCode });
    await program.save();
    
    await AuditTrail.create({
      action: 'Program Created',
      entityType: 'Program',
      entityId: program._id.toString(),
      userId: req.user._id,
      userRole: req.user.role,
      changes: req.body
    });

    // Create notification for relevant roles
    const { createNotification } = await import('../utils/notificationService.js');
    await createNotification(
      'program_created',
      'Program',
      program._id,
      req.user._id,
      { programName: program.programName || program.programCode }
    );
    
    res.status(201).json(program);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', authenticate, authorize('Operations Manager', 'Business Head', 'Director'), async (req, res) => {
  try {
    const program = await Program.findById(req.params.id);
    if (!program) {
      return res.status(404).json({ error: 'Program not found' });
    }
    
    // Business Head and Director can approve/reject
    if ((req.user.role === 'Business Head' || req.user.role === 'Director') && 
        (req.body.trainingStatus === 'Approved' || req.body.trainingStatus === 'Rejected')) {
      if (req.body.trainingStatus === 'Approved') {
        req.body.approvedBy = req.user._id;
        req.body.approvedAt = new Date();
      } else if (req.body.trainingStatus === 'Rejected') {
        req.body.rejectedBy = req.user._id;
        req.body.rejectedAt = new Date();
      }
    }
    
    Object.assign(program, req.body);
    await program.save();
    
    await AuditTrail.create({
      action: 'Program Updated',
      entityType: 'Program',
      entityId: program._id.toString(),
      userId: req.user._id,
      userRole: req.user.role,
      changes: req.body
    });
    
    res.json(program);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/signoff', authenticate, authorize('Operations Manager'), async (req, res) => {
  try {
    const { type } = req.body;
    const update = type === 'trainer' 
      ? { trainerSignOff: true, trainerSignOffDate: new Date() }
      : { clientSignOff: true, clientSignOffDate: new Date() };
    
    const program = await Program.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!program) {
      return res.status(404).json({ error: 'Program not found' });
    }
    
    // Auto-draft invoice when client signs off
    if (type === 'client' && program.clientSignOff) {
      const { autoDraftInvoiceFromProgram } = await import('../utils/autoGeneration.js');
      await autoDraftInvoiceFromProgram(program, req.user._id, req.user.role);
    }
    
    res.json(program);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
