export const generateProgramCode = async (Program) => {
  const count = await Program.countDocuments();
  const year = new Date().getFullYear();
  const code = `PRG-${year}-${String(count + 1).padStart(4, '0')}`;
  return code;
};

export const generateDealId = async (Deal) => {
  const count = await Deal.countDocuments();
  const year = new Date().getFullYear();
  const id = `DEAL-${year}-${String(count + 1).padStart(4, '0')}`;
  return id;
};

export const generatePONumber = async (PurchaseOrder) => {
  const count = await PurchaseOrder.countDocuments();
  const year = new Date().getFullYear();
  const number = `PO-${year}-${String(count + 1).padStart(4, '0')}`;
  return number;
};

export const generateInvoiceNumber = async (Invoice) => {
  const count = await Invoice.countDocuments();
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const number = `INV-${year}${month}-${String(count + 1).padStart(4, '0')}`;
  return number;
};

export const generateVendorPayoutReference = async (Payable) => {
  const count = await Payable.countDocuments();
  const year = new Date().getFullYear();
  const reference = `VPR-${year}-${String(count + 1).padStart(4, '0')}`;
  return reference;
};

export const generateIRN = async (Invoice) => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `IRN${timestamp}${random}`;
};

export const generateEwayBill = async (Invoice) => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 100000);
  return `EWB${timestamp}${random}`;
};

export const generateDealRequestId = async (DealRequest) => {
  const count = await DealRequest.countDocuments();
  const year = new Date().getFullYear();
  const id = `DR-${year}-${String(count + 1).padStart(4, '0')}`;
  return id;
};

// Generate Adhoc ID in format GKTYYCHMM000
export const generateOpportunityId = async (Opportunity) => {
  const now = new Date();
  const year = now.getFullYear();
  const yy = String(year).slice(-2); // Last 2 digits of year
  const mm = String(now.getMonth() + 1).padStart(2, '0'); // Month (01-12)
  
  // Count opportunities created in the current month
  const startOfMonth = new Date(year, now.getMonth(), 1);
  const endOfMonth = new Date(year, now.getMonth() + 1, 0, 23, 59, 59, 999);
  
  const count = await Opportunity.countDocuments({
    createdAt: {
      $gte: startOfMonth,
      $lte: endOfMonth
    }
  });
  
  // Format: GKTYYCHMM000 (12 characters total) - Adhoc ID
  // GKT = company prefix (3 chars)
  // YY = year last 2 digits (2 chars)
  // CH = fixed (2 chars)
  // MM = month (2 chars)
  // 000 = sequential number (3 chars)
  const sequential = String(count + 1).padStart(3, '0');
  const id = `GKT${yy}CH${mm}${sequential}`;
  
  return id;
};

export const generateQuotationNumber = async (Quotation) => {
  const count = await Quotation.countDocuments();
  const year = new Date().getFullYear();
  const number = `QT-${year}-${String(count + 1).padStart(4, '0')}`;
  return number;
};

export const generatePurchaseOfferNumber = async (PurchaseOffer) => {
  const count = await PurchaseOffer.countDocuments();
  const year = new Date().getFullYear();
  const number = `POF-${year}-${String(count + 1).padStart(4, '0')}`;
  return number;
};

export const generateBOCNumber = async (BOC) => {
  const count = await BOC.countDocuments();
  const year = new Date().getFullYear();
  const number = `BOC-${year}-${String(count + 1).padStart(4, '0')}`;
  return number;
};