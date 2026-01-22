import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Vendor from '../models/Vendor.js';
import Deal from '../models/Deal.js';
import DealRequest from '../models/DealRequest.js';
import Program from '../models/Program.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import Invoice from '../models/Invoice.js';
import Opportunity from '../models/Opportunity.js';

const router = express.Router();

// Centralized dropdown options endpoint
router.get('/', authenticate, async (req, res) => {
  try {
    const userRole = req.user.role;
    const options = {};

    // Vendor Type (all roles that can see vendors)
    if (['Operations Manager', 'Finance Manager', 'Director'].includes(userRole)) {
      options.vendorType = ['Individual', 'Company'];
      options.vendorStatus = ['Active', 'Inactive', 'Blacklisted'];
    }

    // Deal Type and Revenue Category (Business Head, Director)
    if (['Business Head', 'Director'].includes(userRole)) {
      options.dealType = ['Training', 'Enablement', 'Consulting', 'Resource Support'];
      options.revenueCategory = ['Corporate', 'Academic', 'School'];
      options.approvalStatus = ['Pending', 'Approved', 'Rejected'];
    }

    // Offering Type (Business Head)
    if (['Business Head', 'Operations Manager', 'Finance Manager', 'Director'].includes(userRole)) {
      options.offeringType = ['Training', 'Product', 'Consulting'];
    }

    // Delivery Mode (Operations Manager)
    if (['Operations Manager', 'Director'].includes(userRole)) {
      options.deliveryMode = ['Onsite', 'Virtual', 'Hybrid'];
      options.batchStatus = ['Scheduled', 'In Progress', 'Completed', 'Cancelled', 'On Hold'];
    }
    
    // Training Opportunities (also for Sales Executive)
    if (['Operations Manager', 'Director', 'Sales Executive', 'Sales Manager'].includes(userRole)) {
      options.trainingOpportunity = ['Training', 'Vouchers', 'Resource Support', 'Lab support', 'Content development', 'Project Support'];
      // Training Sectors
      options.trainingSector = ['Corporate', 'academics', 'university', 'college', 'school'];
      // Training Status
      options.trainingStatus = ['Scheduled', 'In Progress', 'Completed', 'Cancelled', 'On Hold'];
      // Training Supporter
      options.trainingSupporter = ['GKT', 'GKCS', 'MCT'];
      // Training Months
      options.trainingMonth = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      // Location
      options.location = ['Online', 'Classroom', 'Hybrid', 'Classroom / Hybrid'];
      // Technology (common ones)
      options.technology = ['IBM', 'Red Hat', 'Google', 'Microsoft', 'Tableau'];
      // Marketing Charges Percentages
      options.marketingChargesPercent = [5, 10, 15, 20];
      // Contingency Percentages
      options.contingencyPercent = [5, 10, 15, 20];
    }

    // GST Type (Finance Manager, Director)
    if (['Finance Manager', 'Director'].includes(userRole)) {
      options.gstType = ['IGST', 'CGST+SGST'];
      options.invoiceStatus = ['Draft', 'Generated', 'Sent', 'Paid', 'Overdue', 'Cancelled'];
      options.paymentMode = ['NEFT', 'RTGS', 'IMPS', 'UPI', 'Cheque', 'Cash', 'Bank Transfer'];
      options.paymentStatus = ['Pending', 'On Hold', 'Released', 'Paid', 'Cancelled'];
      options.reconciliationStatus = ['Pending', 'Reconciled', 'Discrepancy'];
      options.tdsSection = ['194C', '194J', 'None'];
    }

    // PO Status (Operations Manager, Finance Manager, Director)
    if (['Operations Manager', 'Finance Manager', 'Director'].includes(userRole)) {
      options.poStatus = ['Draft', 'Approved', 'Issued', 'Completed', 'Cancelled'];
    }

    // Material Status and Courier Partners (Operations Manager)
    if (['Operations Manager', 'Finance Manager', 'Director'].includes(userRole)) {
      options.materialStatus = ['Pending', 'Ordered', 'In Transit', 'Delivered', 'Cancelled'];
      options.courierPartner = ['BlueDart', 'FedEx', 'DTDC', 'Delhivery', 'India Post', 'Other'];
    }

    // Sales roles - Opportunity options (Business Head with/without sub-roles, Director)
    const isSalesRole = userRole === 'Business Head' || userRole === 'Director';
    if (isSalesRole) {
      options.opportunityType = ['Training', 'Exam Voucher', 'Content Development / Project Work', 'Consultant (Resource Support)', 'Lab Support', 'Product'];
      options.serviceCategory = ['Enterprise', 'Academic', 'School', 'Government', 'Individual'];
      options.opportunityStatus = ['New', 'Qualified', 'Sent to Delivery', 'Converted to Deal', 'Lost'];
    }

    // Director-specific options
    if (userRole === 'Director') {
      options.approvalDecision = ['Approve', 'Reject', 'Send Back'];
      options.riskCategory = ['Margin', 'Compliance', 'Delivery', 'Fraud'];
      options.auditAction = ['Reviewed', 'Escalated', 'Closed'];
    }

    // Master data - Vendors (filtered by role and status)
    if (['Operations Manager', 'Finance Manager', 'Director'].includes(userRole)) {
      const vendorFilter = { status: 'Active' };
      if (userRole === 'Operations Manager') {
        vendorFilter.blacklistFlag = false;
      }
      const vendors = await Vendor.find(vendorFilter)
        .select('_id vendorName vendorType status')
        .sort({ vendorName: 1 });
      options.vendors = vendors;
    }

    // Master data - Deals (only approved deals for Ops, all for Business Head/Director)
    if (['Operations Manager', 'Business Head', 'Finance Manager', 'Director'].includes(userRole)) {
      const dealFilter = {};
      if (userRole === 'Operations Manager') {
        dealFilter.approvalStatus = 'Approved';
      }
      const deals = await Deal.find(dealFilter)
        .select('_id dealId clientName totalOrderValue approvalStatus')
        .sort({ createdAt: -1 });
      options.deals = deals;
    }

    // Master data - Programs (filtered by status)
    if (['Operations Manager', 'Finance Manager', 'Director'].includes(userRole)) {
      const programFilter = {};
      if (userRole === 'Operations Manager') {
        programFilter.deliveryStatus = { $in: ['Scheduled', 'In Progress'] };
      }
      const programs = await Program.find(programFilter)
        .select('_id programName programCode clientName deliveryStatus clientSignOff')
        .populate('primaryTrainer', 'vendorName')
        .sort({ createdAt: -1 });
      options.programs = programs;
    }

    // Master data - Clients (from approved deals)
    if (['Business Head', 'Operations Manager', 'Finance Manager', 'Director'].includes(userRole)) {
      const clients = await Deal.distinct('clientName', { approvalStatus: 'Approved' });
      options.clients = clients.sort();
    }

    // Master data - Purchase Orders (for Payables)
    if (['Finance Manager', 'Director'].includes(userRole)) {
      const pos = await PurchaseOrder.find({ status: { $in: ['Approved', 'Issued'] } })
        .select('_id internalPONumber vendorId dealId status')
        .populate('vendorId', 'vendorName')
        .sort({ createdAt: -1 });
      options.purchaseOrders = pos;
    }

    // Master data - Invoices (for Receivables)
    if (['Finance Manager', 'Director'].includes(userRole)) {
      const invoices = await Invoice.find({ status: { $in: ['Generated', 'Sent'] } })
        .select('_id clientInvoiceNumber clientName invoiceAmount status')
        .sort({ createdAt: -1 });
      options.invoices = invoices;
    }

    // Master data - Opportunities (for Sales roles and Business Head)
    if (isSalesRole) {
      const opportunities = await Opportunity.find({})
        .select('_id opportunityId clientCompanyName opportunityType opportunityStatus expectedCommercialValue')
        .sort({ createdAt: -1 });
      options.opportunities = opportunities;
    }

    res.json(options);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get available trainers (filtered by availability for Programs)
router.get('/trainers', authenticate, async (req, res) => {
  try {
    const { programStartDate, programEndDate, excludeProgramId } = req.query;
    
    const vendorFilter = { 
      status: 'Active',
      blacklistFlag: false,
      vendorType: { $in: ['Individual', 'Company'] }
    };

    const vendors = await Vendor.find(vendorFilter)
      .select('_id vendorName vendorType email phone')
      .sort({ vendorName: 1 });

    // If dates provided, check trainer availability
    if (programStartDate && programEndDate) {
      const startDate = new Date(programStartDate);
      const endDate = new Date(programEndDate);
      
      const conflictingPrograms = await Program.find({
        primaryTrainer: { $in: vendors.map(v => v._id) },
        deliveryStatus: { $in: ['Scheduled', 'In Progress'] },
        $or: [
          { startDate: { $lte: endDate }, endDate: { $gte: startDate } }
        ]
      }).select('primaryTrainer');

      const busyTrainerIds = new Set(conflictingPrograms.map(p => p.primaryTrainer.toString()));
      
      const availableVendors = vendors.filter(v => !busyTrainerIds.has(v._id.toString()));
      return res.json(availableVendors);
    }

    res.json(vendors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get GST type based on location (cascading)
router.get('/gst-type', authenticate, async (req, res) => {
  try {
    const { location, vendorLocation } = req.query;
    
    // Simple logic: if location is same state as company, use CGST+SGST, else IGST
    // For now, return both options - frontend can determine based on location
    // In production, this would check against a state master
    res.json({
      options: ['IGST', 'CGST+SGST'],
      default: 'IGST' // Default to IGST for inter-state
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
