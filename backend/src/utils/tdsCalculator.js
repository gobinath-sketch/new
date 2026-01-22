import { calculateTDSWithAI } from './aiDecisionEngine.js';

// Legacy function - now uses AI
export const calculateTDS = async (vendorType, natureOfService, paymentAmount, panNumber, vendorYearlyTotal = 0) => {
  return await calculateTDSWithAI(vendorType, natureOfService, paymentAmount, panNumber, vendorYearlyTotal);
};

// Old rule-based function (kept for fallback)
export const calculateTDS_OLD = (vendorType, natureOfService, paymentAmount, panNumber, vendorYearlyTotal = 0) => {
  let tdsSection = 'None';
  let applicableTdsPercent = 0;
  let thresholdCheckResult = 'Below Threshold';
  let panAvailabilityFlag = !!panNumber;
  let panNotProvidedTdsPercent = 0;
  let complianceStatus = 'Compliant';

  // Check PAN availability
  if (!panNumber || panNumber.trim() === '') {
    panAvailabilityFlag = false;
    panNotProvidedTdsPercent = 20; // 20% TDS if PAN not provided
    complianceStatus = 'Pending PAN';
  }

  // Determine TDS Section based on nature of service
  if (natureOfService === 'Contractor') {
    tdsSection = '194C';
    
    // Section 194C thresholds
    const contractThreshold = 30000;
    const yearlyThreshold = 100000;
    
    // Check if payment amount OR yearly total exceeds threshold
    const currentPaymentPlusYearly = paymentAmount + vendorYearlyTotal;
    if (paymentAmount > contractThreshold || currentPaymentPlusYearly > yearlyThreshold) {
      thresholdCheckResult = 'Above Threshold';
      
      // Determine payee type
      if (vendorType === 'Individual' || vendorType === 'HUF') {
        applicableTdsPercent = 1;
      } else if (vendorType === 'Company' || vendorType === 'Firm' || vendorType === 'LLP') {
        applicableTdsPercent = 2;
      }
    }
  } else if (['Professional Services', 'Technical Services', 'Call Centre Services'].includes(natureOfService)) {
    tdsSection = '194J';
    
    // Section 194J threshold
    const threshold = 50000;
    
    // Check if yearly total (including current payment) exceeds threshold
    const currentPaymentPlusYearly = paymentAmount + vendorYearlyTotal;
    if (currentPaymentPlusYearly > threshold) {
      thresholdCheckResult = 'Above Threshold';
      
      if (natureOfService === 'Professional Services') {
        applicableTdsPercent = 10;
      } else if (natureOfService === 'Technical Services' || natureOfService === 'Call Centre Services') {
        applicableTdsPercent = 2;
      }
    }
  }

  // Apply higher TDS if PAN not provided
  if (!panAvailabilityFlag && thresholdCheckResult === 'Above Threshold') {
    applicableTdsPercent = Math.max(applicableTdsPercent, panNotProvidedTdsPercent);
    complianceStatus = 'Pending PAN';
  }

  // Calculate TDS amount
  const tdsAmount = (paymentAmount * applicableTdsPercent) / 100;
  const netPayableAmount = paymentAmount - tdsAmount;

  // Determine payee type for display
  let payeeType = 'Company/Firm/LLP';
  if (vendorType === 'Individual' || vendorType === 'HUF') {
    payeeType = 'Individual/HUF';
  }

  return {
    tdsSection,
    payeeType,
    applicableTdsPercent,
    thresholdCheckResult,
    tdsAmount,
    netPayableAmount,
    panAvailabilityFlag,
    panNotProvidedTdsPercent,
    complianceStatus
  };
};

export const getVendorYearlyTotal = async (Vendor, Payable, vendorId, currentYear) => {
  try {
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59);
    
    const payables = await Payable.find({
      vendorId,
      createdAt: { $gte: yearStart, $lte: yearEnd }
    });
    
    // Use adjustedPayableAmount for threshold calculation (total payments made/committed)
    return payables.reduce((sum, p) => sum + (p.adjustedPayableAmount || 0), 0);
  } catch (error) {
    return 0;
  }
};
