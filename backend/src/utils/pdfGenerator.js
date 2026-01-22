import PDFDocument from 'pdfkit';
import { generateInvoiceSummary, generatePOSummary, generateTaxExplanation, generatePaymentSummary, generateDealSummary } from './erpDocumentAssistant.js';

// Create PDF document with enterprise standards
const createPDFDocument = () => {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 50, right: 50 }
  });

  // Set font (system sans-serif equivalent)
  doc.font('Helvetica');

  return doc;
};

// Add header to PDF
const addHeader = (doc, companyName, documentType, documentNumber, date) => {
  doc.fontSize(16).font('Helvetica-Bold').text(companyName, { align: 'left' });
  doc.moveDown(0.5);
  doc.fontSize(12).font('Helvetica').text(documentType, { align: 'left' });
  if (documentNumber) {
    doc.fontSize(10).text(`Document Number: ${documentNumber}`, { align: 'left' });
  }
  if (date) {
    doc.fontSize(10).text(`Date: ${new Date(date).toLocaleDateString('en-IN')}`, { align: 'left' });
  }
  doc.moveDown(1);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(1);
};

// Add metadata block
const addMetadata = (doc, metadata) => {
  doc.fontSize(10).font('Helvetica');
  Object.entries(metadata).forEach(([key, value]) => {
    if (value) {
      doc.text(`${key}: ${value}`, { align: 'left' });
    }
  });
  doc.moveDown(1);
};

// Add table to PDF
const addTable = (doc, headers, rows) => {
  const startY = doc.y;
  const tableTop = startY;
  const cellPadding = 5;
  const rowHeight = 20;
  const colWidths = [200, 150, 150];
  
  // Headers
  doc.fontSize(10).font('Helvetica-Bold');
  let x = 50;
  headers.forEach((header, i) => {
    doc.text(header, x, tableTop, { width: colWidths[i] || 150 });
    x += colWidths[i] || 150;
  });
  
  // Rows
  doc.fontSize(9).font('Helvetica');
  rows.forEach((row, rowIndex) => {
    const y = tableTop + rowHeight + (rowIndex * rowHeight);
    x = 50;
    row.forEach((cell, colIndex) => {
      const alignment = colIndex === row.length - 1 ? 'right' : 'left';
      doc.text(String(cell || ''), x, y, { 
        width: colWidths[colIndex] || 150,
        align: alignment
      });
      x += colWidths[colIndex] || 150;
    });
  });
  
  doc.moveDown(rows.length + 1);
};

// Add AI-generated summary section
const addAISummary = async (doc, summaryText, role) => {
  if (!summaryText) return;
  
  doc.moveDown(1);
  doc.fontSize(11).font('Helvetica-Bold').text('System-Generated Summary', { align: 'left' });
  doc.moveDown(0.5);
  doc.fontSize(9).font('Helvetica');
  
  // Split text into paragraphs and add
  const paragraphs = summaryText.split('\n\n').filter(p => p.trim());
  paragraphs.forEach(paragraph => {
    doc.text(paragraph.trim(), { align: 'left', lineGap: 3 });
    doc.moveDown(0.5);
  });
  
  doc.moveDown(1);
};


// Generate Invoice PDF
export const generateInvoicePDF = async (invoice, role) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = createPDFDocument();
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      addHeader(doc, 'Single Playground ERP', 'Client Invoice', invoice.clientInvoiceNumber, invoice.invoiceDate);
      
      addMetadata(doc, {
        'Client Name': invoice.clientName,
        'Program Reference': invoice.programId ? 'Linked' : 'N/A',
        'Status': invoice.status
      });

      addTable(doc, 
        ['Description', 'Amount (₹)', 'Total (₹)'],
        [
          ['Invoice Amount', invoice.invoiceAmount?.toFixed(2) || '0.00', ''],
          ['GST (' + (invoice.gstPercent || 0) + '%)', invoice.taxAmount?.toFixed(2) || '0.00', ''],
          ['Total Amount', '', invoice.totalAmount?.toFixed(2) || '0.00']
        ]
      );

      // Add AI summary if applicable
      try {
        if (role === 'Finance Manager' || role === 'Director') {
          const summary = await generateInvoiceSummary(invoice, role);
          if (summary && summary !== 'Document insight could not be generated due to incomplete or unavailable data.') {
            await addAISummary(doc, summary, role);
          }
        }
      } catch (aiError) {
        // Continue without AI summary if it fails
        console.error('AI summary generation failed:', aiError.message);
      }

      let pageNumber = 1;
      const addFooterToPage = (pageNum) => {
        const pageHeight = doc.page.height;
        const footerY = pageHeight - 50;
        doc.fontSize(8).font('Helvetica');
        doc.text(`Page ${pageNum}`, 50, footerY, { align: 'left' });
        doc.text('This document is system-generated', 545, footerY, { align: 'right' });
      };

      doc.on('pageAdded', () => {
        pageNumber++;
        addFooterToPage(pageNumber);
      });

      addFooterToPage(pageNumber);
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// Generate PO PDF
export const generatePOPDF = async (po, role) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = createPDFDocument();
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      addHeader(doc, 'Single Playground ERP', 'Internal Purchase Order', po.internalPONumber, po.createdAt);
      
      addMetadata(doc, {
        'Vendor': po.vendorName || 'N/A',
        'Deal Reference': po.dealId ? 'Linked' : 'N/A',
        'Status': po.status
      });

      addTable(doc,
        ['Item', 'Amount (₹)', 'Total (₹)'],
        [
          ['Approved Cost', po.approvedCost?.toFixed(2) || '0.00', ''],
          ['Adjusted Payable', po.adjustedPayableAmount?.toFixed(2) || '0.00', ''],
          ['Cost Type', po.costType || 'N/A', '']
        ]
      );

      // Add AI summary if applicable
      try {
        if (role === 'Operations Manager' || role === 'Finance Manager' || role === 'Director') {
          const poData = {
            internalPONumber: po.internalPONumber,
            vendorName: po.vendorName,
            approvedCost: po.approvedCost,
            adjustedPayableAmount: po.adjustedPayableAmount,
            status: po.status,
            costType: po.costType
          };
          const summary = await generatePOSummary(poData, role);
          if (summary && summary !== 'Document insight could not be generated due to incomplete or unavailable data.') {
            await addAISummary(doc, summary, role);
          }
        }
      } catch (aiError) {
        console.error('AI summary generation failed:', aiError.message);
      }

      let pageNumber = 1;
      const addFooterToPage = (pageNum) => {
        const pageHeight = doc.page.height;
        const footerY = pageHeight - 50;
        doc.fontSize(8).font('Helvetica');
        doc.text(`Page ${pageNum}`, 50, footerY, { align: 'left' });
        doc.text('This document is system-generated', 545, footerY, { align: 'right' });
      };

      doc.on('pageAdded', () => {
        pageNumber++;
        addFooterToPage(pageNumber);
      });

      addFooterToPage(pageNumber);
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// Generate Tax/TDS PDF
export const generateTaxPDF = async (taxRecord, role) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = createPDFDocument();
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      addHeader(doc, 'Single Playground ERP', 'Tax Deducted at Source (TDS) Summary', taxRecord._id.toString(), taxRecord.createdAt);
      
      addMetadata(doc, {
        'TDS Section': taxRecord.tdsSection,
        'Payee Type': taxRecord.payeeType,
        'Nature of Service': taxRecord.natureOfService,
        'Compliance Status': taxRecord.complianceStatus
      });

      addTable(doc,
        ['Item', 'Amount (₹)', 'Percentage'],
        [
          ['Payment Amount', taxRecord.paymentAmount?.toFixed(2) || '0.00', ''],
          ['TDS Rate', '', (taxRecord.applicableTdsPercent || 0) + '%'],
          ['TDS Amount', taxRecord.tdsAmount?.toFixed(2) || '0.00', ''],
          ['Net Payable', taxRecord.netPayableAmount?.toFixed(2) || '0.00', '']
        ]
      );

      // Add AI explanation if applicable
      try {
        if (role === 'Finance Manager' || role === 'Director') {
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
          const explanation = await generateTaxExplanation(taxData, role);
          if (explanation && explanation !== 'Document insight could not be generated due to incomplete or unavailable data.') {
            await addAISummary(doc, explanation, role);
          }
        }
      } catch (aiError) {
        console.error('AI explanation generation failed:', aiError.message);
      }

      let pageNumber = 1;
      const addFooterToPage = (pageNum) => {
        const pageHeight = doc.page.height;
        const footerY = pageHeight - 50;
        doc.fontSize(8).font('Helvetica');
        doc.text(`Page ${pageNum}`, 50, footerY, { align: 'left' });
        doc.text('This document is system-generated', 545, footerY, { align: 'right' });
      };

      doc.on('pageAdded', () => {
        pageNumber++;
        addFooterToPage(pageNumber);
      });

      addFooterToPage(pageNumber);
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// Generate Payment Summary PDF
export const generatePaymentPDF = async (payable, role) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = createPDFDocument();
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      addHeader(doc, 'Single Playground ERP', 'Vendor Payment Summary', payable.vendorPayoutReference, payable.createdAt);
      
      addMetadata(doc, {
        'Vendor': payable.vendorName,
        'Status': payable.status,
        'Due Date': payable.dueDate ? new Date(payable.dueDate).toLocaleDateString('en-IN') : 'N/A'
      });

      addTable(doc,
        ['Item', 'Amount (₹)', ''],
        [
          ['Approved Cost', payable.approvedCost?.toFixed(2) || '0.00', ''],
          ['Adjusted Payable', payable.adjustedPayableAmount?.toFixed(2) || '0.00', ''],
          ['Outstanding Amount', payable.outstandingAmount?.toFixed(2) || '0.00', '']
        ]
      );

      // Add AI summary if applicable
      try {
        if (role === 'Finance Manager' || role === 'Director') {
          const paymentData = {
            vendorPayoutReference: payable.vendorPayoutReference,
            vendorName: payable.vendorName,
            adjustedPayableAmount: payable.adjustedPayableAmount,
            outstandingAmount: payable.outstandingAmount,
            status: payable.status,
            dueDate: payable.dueDate,
            paymentTerms: payable.paymentTerms
          };
          const summary = await generatePaymentSummary(paymentData, role);
          if (summary && summary !== 'Document insight could not be generated due to incomplete or unavailable data.') {
            await addAISummary(doc, summary, role);
          }
        }
      } catch (aiError) {
        console.error('AI summary generation failed:', aiError.message);
      }

      let pageNumber = 1;
      const addFooterToPage = (pageNum) => {
        const pageHeight = doc.page.height;
        const footerY = pageHeight - 50;
        doc.fontSize(8).font('Helvetica');
        doc.text(`Page ${pageNum}`, 50, footerY, { align: 'left' });
        doc.text('This document is system-generated', 545, footerY, { align: 'right' });
      };

      doc.on('pageAdded', () => {
        pageNumber++;
        addFooterToPage(pageNumber);
      });

      addFooterToPage(pageNumber);
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// Generate Deal Summary PDF
export const generateDealPDF = async (deal, role) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = createPDFDocument();
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      addHeader(doc, 'Single Playground ERP', 'Commercial Deal Summary', deal.dealId, deal.createdAt);
      
      addMetadata(doc, {
        'Client': deal.clientName,
        'Margin Status': deal.marginThresholdStatus,
        'Approval Status': deal.approvalStatus
      });

      addTable(doc,
        ['Item', 'Amount (₹)', ''],
        [
          ['Total Order Value', deal.totalOrderValue?.toFixed(2) || '0.00', ''],
          ['Trainer Cost', deal.trainerCost?.toFixed(2) || '0.00', ''],
          ['Lab Cost', deal.labCost?.toFixed(2) || '0.00', ''],
          ['Logistics Cost', deal.logisticsCost?.toFixed(2) || '0.00', ''],
          ['Content Cost', deal.contentCost?.toFixed(2) || '0.00', ''],
          ['Contingency', deal.contingencyBuffer?.toFixed(2) || '0.00', ''],
          ['Gross Margin %', '', (deal.grossMarginPercent || 0).toFixed(2) + '%']
        ]
      );

      // Add AI summary if applicable
      try {
        if (role === 'Business Head' || role === 'Director') {
          const summary = await generateDealSummary(deal, role);
          if (summary && summary !== 'Document insight could not be generated due to incomplete or unavailable data.') {
            await addAISummary(doc, summary, role);
          }
        }
      } catch (aiError) {
        console.error('AI summary generation failed:', aiError.message);
      }

      let pageNumber = 1;
      const addFooterToPage = (pageNum) => {
        const pageHeight = doc.page.height;
        const footerY = pageHeight - 50;
        doc.fontSize(8).font('Helvetica');
        doc.text(`Page ${pageNum}`, 50, footerY, { align: 'left' });
        doc.text('This document is system-generated', 545, footerY, { align: 'right' });
      };

      doc.on('pageAdded', () => {
        pageNumber++;
        addFooterToPage(pageNumber);
      });

      addFooterToPage(pageNumber);
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

export const generateOpportunityPDF = async (opportunity, role) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = createPDFDocument();
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      addHeader(doc, 'Single Playground ERP', 'Opportunity Summary', opportunity.opportunityId || 'N/A', opportunity.createdAt || new Date());

      // Opportunity Details
      addMetadata(doc, {
        'Adhoc ID': opportunity.opportunityId || 'N/A',
        'Client Company': opportunity.clientCompanyName || 'N/A',
        'Contact Name': opportunity.clientContactName || 'N/A',
        'Email': opportunity.clientEmail || 'N/A',
        'Phone': opportunity.clientPhone || 'N/A',
        'Designation': opportunity.designation || 'N/A',
        'Location': opportunity.location || 'N/A',
        'Opportunity Type': opportunity.opportunityType || 'N/A',
        'Service Category': opportunity.serviceCategory || 'N/A',
        'Expected Participants': opportunity.expectedParticipants?.toString() || 'N/A',
        'Expected Duration (Days)': opportunity.expectedDuration?.toString() || 'N/A',
        'Expected Start Date': opportunity.expectedStartDate ? new Date(opportunity.expectedStartDate).toLocaleDateString('en-IN') : 'N/A',
        'Expected Commercial Value': `₹${opportunity.expectedCommercialValue?.toLocaleString('en-IN') || '0'}`,
        'Status': opportunity.opportunityStatus || 'N/A',
        'Created By': opportunity.salesExecutiveId?.name || opportunity.salesExecutiveId || 'N/A',
        'Created Date': opportunity.createdAt ? new Date(opportunity.createdAt).toLocaleDateString('en-IN') : 'N/A'
      });

      if (opportunity.qualifiedAt) {
        doc.moveDown(0.5);
        doc.fontSize(10).text(`Qualified: ${new Date(opportunity.qualifiedAt).toLocaleDateString('en-IN')}`, { align: 'left' });
      }

      if (opportunity.sentToDeliveryAt) {
        doc.fontSize(10).text(`Sent to Delivery: ${new Date(opportunity.sentToDeliveryAt).toLocaleDateString('en-IN')}`, { align: 'left' });
      }

      if (opportunity.convertedToDealId) {
        const dealId = opportunity.convertedToDealId?.dealId || opportunity.convertedToDealId || 'N/A';
        doc.fontSize(10).text(`Converted to Deal: ${dealId}`, { align: 'left' });
      }

      if (opportunity.notes) {
        doc.moveDown(1);
        doc.fontSize(10).font('Helvetica-Bold').text('Notes:', { align: 'left' });
        doc.font('Helvetica').text(opportunity.notes, { align: 'left' });
      }

      let pageNumber = 1;
      const addFooterToPage = (pageNum) => {
        const pageHeight = doc.page.height;
        const footerY = pageHeight - 50;
        doc.fontSize(8).font('Helvetica');
        doc.text(`Page ${pageNum}`, 50, footerY, { align: 'left' });
        doc.text('This document is system-generated', 545, footerY, { align: 'right' });
      };

      addFooterToPage(pageNumber);
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

export default {
  generateInvoicePDF,
  generatePOPDF,
  generateTaxPDF,
  generatePaymentPDF,
  generateDealPDF,
  generateOpportunityPDF
};
