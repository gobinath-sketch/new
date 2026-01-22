import InternalPOStatus from '../models/InternalPOStatus.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import Invoice from '../models/Invoice.js';
import Receivable from '../models/Receivable.js';
import { generatePONumber } from './generators.js';
import SystemEventLog from '../models/SystemEventLog.js';

export const autoGeneratePOFromDeal = async (dealRequest, userId, userRole) => {
  try {
    // Use AI to decide if PO should be auto-generated
    const { shouldAutoGenerateWithAI } = await import('./aiDecisionEngine.js');
    const automationDecision = await shouldAutoGenerateWithAI('Deal Approval', {
      dealRequestId: dealRequest._id.toString(),
      dealId: dealRequest.dealId,
      clientName: dealRequest.clientName,
      expectedRevenue: dealRequest.expectedRevenue,
      marginStatus: dealRequest.marginStatus,
      approvalStatus: dealRequest.dealApprovalStatus
    });

    if (!automationDecision.shouldGenerate) {
      console.log('AI decided not to auto-generate PO:', automationDecision.reason);
      return null;
    }

    // Check if PO status already exists for this deal request (idempotency)
    const existingPO = await InternalPOStatus.findOne({ 
      linkedDealRequestId: dealRequest._id 
    });
    
    if (existingPO) {
      // Already exists, return it
      return existingPO;
    }
    
    // This is called when deal is approved by Business Head
    // Creates PO status record that Ops can link to actual PO later
    
    // Generate unique PO number with timestamp and random to avoid collisions
    const uniqueNumber = `PO-STATUS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const poStatus = new InternalPOStatus({
      internalPONumber: uniqueNumber,
      linkedDealRequestId: dealRequest._id,
      vendorName: 'Pending Assignment',
      approvedCost: 0,
      costType: 'Other',
      poStatus: 'Draft'
    });
    await poStatus.save();

    try {
      await SystemEventLog.create({
        eventType: 'PO Auto-Generated',
        entityType: 'InternalPOStatus',
        entityId: poStatus._id.toString(),
        userId,
        userRole,
        action: 'Auto-generated PO status from approved deal',
        downstreamAction: 'Awaiting Ops PO creation'
      });
    } catch (logError) {
      // Don't fail if logging fails
      console.error('Error creating system event log:', logError.message);
    }

    return poStatus;
  } catch (error) {
    console.error('Auto-generate PO error:', error.message, error.stack);
    throw error; // Re-throw to see actual error
  }
};

export const autoDraftInvoiceFromProgram = async (program, userId, userRole) => {
  try {
    // This is called when program client sign-off happens
    // Invoice is already auto-generated in the invoice route when clientSignOff is true
    // This is just for logging
    
    await SystemEventLog.create({
      eventType: 'Invoice Auto-Generated',
      entityType: 'Program',
      entityId: program._id.toString(),
      userId,
      userRole,
      action: 'Invoice ready for generation after client sign-off',
      downstreamAction: 'Finance can generate invoice'
    });

    return true;
  } catch (error) {
    console.error('Auto-draft invoice error:', error);
    return false;
  }
};

export const autoPostLedgerEntry = async (invoice, userId, userRole) => {
  try {
    // Reload invoice to ensure all calculated fields (totalAmount) are present
    const freshInvoice = await Invoice.findById(invoice._id);
    if (!freshInvoice) {
      throw new Error('Invoice not found after creation');
    }
    
    // When invoice is created, create receivable automatically
    const existingReceivable = await Receivable.findOne({ invoiceId: freshInvoice._id });
    
    if (!existingReceivable) {
      const dueDate = new Date(freshInvoice.invoiceDate);
      dueDate.setDate(dueDate.getDate() + 30); // Default 30 days

      const invoiceAmount = freshInvoice.totalAmount || freshInvoice.invoiceAmount || 0;
      if (!invoiceAmount || invoiceAmount === 0) {
        throw new Error(`Invoice amount is required for receivable creation. Total: ${freshInvoice.totalAmount}, Amount: ${freshInvoice.invoiceAmount}`);
      }
      
      if (!freshInvoice.clientInvoiceNumber) {
        throw new Error('Invoice number is required for receivable creation');
      }
      
      const receivable = new Receivable({
        invoiceId: freshInvoice._id,
        clientName: freshInvoice.clientName,
        invoiceNumber: freshInvoice.clientInvoiceNumber,
        invoiceAmount: invoiceAmount,
        outstandingAmount: invoiceAmount,
        paymentTerms: 30,
        dueDate,
        status: 'Pending'
      });
      await receivable.save();

      try {
        await SystemEventLog.create({
          eventType: 'Ledger Entry Posted',
          entityType: 'Receivable',
          entityId: receivable._id.toString(),
          userId,
          userRole,
          action: 'Auto-created receivable from invoice',
          downstreamAction: 'Payment tracking enabled'
        });
      } catch (logError) {
        // Don't fail if logging fails
        console.error('Error creating system event log:', logError.message);
      }

      return receivable;
    }

    return existingReceivable;
  } catch (error) {
    console.error('Auto-post ledger error:', error.message);
    throw error; // Re-throw to see actual error
  }
};
