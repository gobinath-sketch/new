import express from 'express';
import Client from '../models/Client.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { AuditTrail } from '../models/Governance.js';

const router = express.Router();

router.get('/', authenticate, authorize('Sales Executive', 'Sales Manager', 'Director'), async (req, res) => {
  try {
    let filter = {};
    
    // Sales Executive can only see their own clients
    // Sales Manager and Director can see all clients
    if (req.user.role === 'Sales Executive') {
      filter.createdBy = req.user._id;
    }
    
    const clients = await Client.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authenticate, authorize('Sales Executive', 'Sales Manager', 'Director'), async (req, res) => {
  try {
    const client = await Client.findById(req.params.id).populate('createdBy', 'name email');
    
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    // Sales Executive can only see their own clients
    if (req.user.role === 'Sales Executive') {
      const createdById = client.createdBy._id ? client.createdBy._id.toString() : client.createdBy.toString();
      if (createdById !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    
    res.json(client);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticate, authorize('Sales Executive', 'Sales Manager'), async (req, res) => {
  try {
    const client = new Client({
      ...req.body,
      createdBy: req.user._id
    });
    await client.save();
    
    await AuditTrail.create({
      action: 'Client Created',
      entityType: 'Client',
      entityId: client._id.toString(),
      userId: req.user._id,
      userRole: req.user.role,
      changes: req.body
    });
    
    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', authenticate, authorize('Sales Executive', 'Sales Manager'), async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    // Sales Executive can only update their own clients
    // Sales Manager can update any client (team management)
    if (req.user.role === 'Sales Executive' && client.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    Object.assign(client, req.body);
    await client.save();
    
    await AuditTrail.create({
      action: 'Client Updated',
      entityType: 'Client',
      entityId: client._id.toString(),
      userId: req.user._id,
      userRole: req.user.role,
      changes: req.body
    });
    
    res.json(client);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
