import ExcelJS from 'exceljs';

// Generate Excel workbook with enterprise standards
const createWorkbook = () => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Single Playground ERP';
  workbook.created = new Date();
  return workbook;
};

// Generate Receivables Aging Report (Excel)
export const generateReceivablesExcel = (receivables) => {
  const workbook = createWorkbook();
  const worksheet = workbook.addWorksheet('Receivables Aging');

  // Headers
  worksheet.columns = [
    { header: 'Invoice Number', key: 'invoiceNumber', width: 20 },
    { header: 'Client Name', key: 'clientName', width: 30 },
    { header: 'Invoice Amount', key: 'invoiceAmount', width: 15 },
    { header: 'Outstanding Amount', key: 'outstandingAmount', width: 18 },
    { header: 'Due Date', key: 'dueDate', width: 12 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Days Overdue', key: 'daysOverdue', width: 15 }
  ];

  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).alignment = { horizontal: 'left' };

  // Add data
  receivables.forEach(receivable => {
    const dueDate = receivable.dueDate ? new Date(receivable.dueDate) : null;
    const daysOverdue = dueDate ? Math.max(0, Math.floor((new Date() - dueDate) / (1000 * 60 * 60 * 24))) : 0;
    
    worksheet.addRow({
      invoiceNumber: receivable.invoiceNumber || '',
      clientName: receivable.clientName || '',
      invoiceAmount: receivable.invoiceAmount || 0,
      outstandingAmount: receivable.outstandingAmount || 0,
      dueDate: dueDate ? dueDate.toLocaleDateString('en-IN') : '',
      status: receivable.status || '',
      daysOverdue: daysOverdue
    });
  });

  // Format number columns
  worksheet.getColumn('invoiceAmount').numFmt = '#,##0.00';
  worksheet.getColumn('outstandingAmount').numFmt = '#,##0.00';
  worksheet.getColumn('invoiceAmount').alignment = { horizontal: 'right' };
  worksheet.getColumn('outstandingAmount').alignment = { horizontal: 'right' };

  return workbook;
};

// Generate Payables Report (Excel)
export const generatePayablesExcel = (payables) => {
  const workbook = createWorkbook();
  const worksheet = workbook.addWorksheet('Payables');

  worksheet.columns = [
    { header: 'Payout Reference', key: 'reference', width: 20 },
    { header: 'Vendor Name', key: 'vendorName', width: 30 },
    { header: 'Approved Cost', key: 'approvedCost', width: 15 },
    { header: 'Payable Amount', key: 'payableAmount', width: 15 },
    { header: 'Outstanding', key: 'outstanding', width: 15 },
    { header: 'Due Date', key: 'dueDate', width: 12 },
    { header: 'Status', key: 'status', width: 12 }
  ];

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).alignment = { horizontal: 'left' };

  payables.forEach(payable => {
    worksheet.addRow({
      reference: payable.vendorPayoutReference || '',
      vendorName: payable.vendorName || '',
      approvedCost: payable.approvedCost || 0,
      payableAmount: payable.adjustedPayableAmount || 0,
      outstanding: payable.outstandingAmount || 0,
      dueDate: payable.dueDate ? new Date(payable.dueDate).toLocaleDateString('en-IN') : '',
      status: payable.status || ''
    });
  });

  worksheet.getColumn('approvedCost').numFmt = '#,##0.00';
  worksheet.getColumn('payableAmount').numFmt = '#,##0.00';
  worksheet.getColumn('outstanding').numFmt = '#,##0.00';
  worksheet.getColumn('approvedCost').alignment = { horizontal: 'right' };
  worksheet.getColumn('payableAmount').alignment = { horizontal: 'right' };
  worksheet.getColumn('outstanding').alignment = { horizontal: 'right' };

  return workbook;
};

// Generate Revenue Report (Excel)
export const generateRevenueExcel = (invoices, groupBy = 'month') => {
  const workbook = createWorkbook();
  const worksheet = workbook.addWorksheet('Revenue Report');

  worksheet.columns = [
    { header: 'Period', key: 'period', width: 20 },
    { header: 'Invoice Count', key: 'count', width: 15 },
    { header: 'Total Revenue', key: 'revenue', width: 18 },
    { header: 'Tax Amount', key: 'tax', width: 15 },
    { header: 'Net Revenue', key: 'net', width: 15 }
  ];

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).alignment = { horizontal: 'left' };

  // Group invoices by period
  const grouped = {};
  invoices.forEach(invoice => {
    const date = new Date(invoice.invoiceDate);
    let period;
    if (groupBy === 'month') {
      period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    } else if (groupBy === 'quarter') {
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      period = `Q${quarter} ${date.getFullYear()}`;
    } else {
      period = date.getFullYear().toString();
    }

    if (!grouped[period]) {
      grouped[period] = { count: 0, revenue: 0, tax: 0, net: 0 };
    }
    grouped[period].count++;
    grouped[period].revenue += invoice.totalAmount || 0;
    grouped[period].tax += invoice.taxAmount || 0;
    grouped[period].net += invoice.invoiceAmount || 0;
  });

  Object.entries(grouped).sort().forEach(([period, data]) => {
    worksheet.addRow({
      period,
      count: data.count,
      revenue: data.revenue,
      tax: data.tax,
      net: data.net
    });
  });

  worksheet.getColumn('revenue').numFmt = '#,##0.00';
  worksheet.getColumn('tax').numFmt = '#,##0.00';
  worksheet.getColumn('net').numFmt = '#,##0.00';
  worksheet.getColumn('revenue').alignment = { horizontal: 'right' };
  worksheet.getColumn('tax').alignment = { horizontal: 'right' };
  worksheet.getColumn('net').alignment = { horizontal: 'right' };

  return workbook;
};

// Generate CSV from data array
export const generateCSV = (data, headers) => {
  const csvHeaders = headers.join(',');
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header] || '';
      // Escape commas and quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });
  
  return csvHeaders + '\n' + csvRows.join('\n');
};

export default {
  generateReceivablesExcel,
  generatePayablesExcel,
  generateRevenueExcel,
  generateCSV
};
