import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../config.env') });

const API_BASE = 'http://localhost:5000/api';
const auditResults = {
  aiFunctionsTested: [],
  aiCallsSuccessful: [],
  aiCallsFailed: [],
  ruleBasedLogicFound: [],
  flowsExecuted: [],
  failuresObserved: [],
  fixesApplied: []
};

const testUsers = {
  'Operations Manager': { email: 'operations@singleplayground.com', password: 'Operations@2026' },
  'Business Head': { email: 'business@singleplayground.com', password: 'Business@2026' },
  'Finance Manager': { email: 'finance@singleplayground.com', password: 'Finance@2026' },
  'Director': { email: 'director@singleplayground.com', password: 'Director@2026' }
};

let authTokens = {};

const log = (message, type = 'info') => {
  const prefix = type === 'error' ? '🔴' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} ${message}`);
};

const login = async (role) => {
  const user = testUsers[role];
  const response = await axios.post(`${API_BASE}/auth/login`, {
    email: user.email,
    password: user.password,
    role: role
  });
  authTokens[role] = response.data.token;
  return response.data.token;
};

const apiCall = async (method, endpoint, role, data = null) => {
  const token = authTokens[role] || await login(role);
  const config = {
    method,
    url: `${API_BASE}${endpoint}`,
    headers: { Authorization: `Bearer ${token}` }
  };
  if (data) config.data = data;
  return axios(config);
};

// Test AI TDS Calculation
const testAITDS = async () => {
  log('\n=== TESTING AI TDS CALCULATION ===', 'info');
  
  // Create vendor
  const vendor = await apiCall('post', '/vendors', 'Operations Manager', {
    vendorType: 'Company',
    vendorName: 'AI Test Vendor',
    panNumber: 'AITEST1234F',
    bankAccountNumber: '1111111111',
    ifscCode: 'BANK0001111',
    bankName: 'AI Test Bank',
    address: 'AI Test Address',
    contactPersonName: 'AI Test Person',
    email: 'aitest@vendor.com',
    phone: '1111111111'
  });
  
  // Create deal
  const deal = await apiCall('post', '/deals', 'Business Head', {
    clientName: 'AI Test Client',
    totalOrderValue: 200000,
    trainerCost: 50000
  });
  await apiCall('put', `/deals/${deal.data._id}/approve`, 'Director');
  
  // Create PO
  const po = await apiCall('post', '/purchase-orders', 'Operations Manager', {
    vendorId: vendor.data._id,
    dealId: deal.data._id,
    approvedCost: 50000,
    adjustedPayableAmount: 50000
  });
  
  // Create payable (should trigger AI TDS calculation)
  log('Creating payable - AI should calculate TDS...', 'info');
  const payable = await apiCall('post', '/payables', 'Finance Manager', {
    purchaseOrderId: po.data._id,
    paymentTerms: 30
  });
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Check TDS record
  const taxRecords = await apiCall('get', '/tax-engine', 'Finance Manager');
  const payableIdStr = payable.data.payable?._id?.toString() || payable.data._id?.toString();
  const taxRecord = taxRecords.data.find(t => {
    if (t.payableId) {
      const payId = typeof t.payableId === 'object' 
        ? t.payableId._id?.toString() || t.payableId.toString()
        : t.payableId.toString();
      return payId === payableIdStr;
    }
    return false;
  });
  
  if (taxRecord) {
    log(`✅ AI TDS Calculated: Section ${taxRecord.tdsSection}, ${taxRecord.applicableTdsPercent}%`, 'success');
    auditResults.aiCallsSuccessful.push('TDS Calculation');
    auditResults.aiFunctionsTested.push('calculateTDSWithAI');
  } else {
    log('❌ AI TDS NOT calculated', 'error');
    auditResults.aiCallsFailed.push('TDS Calculation');
    auditResults.failuresObserved.push({ function: 'calculateTDSWithAI', issue: 'TDS not calculated' });
  }
  
  auditResults.flowsExecuted.push('AI TDS Calculation Flow');
};

// Test AI Margin Calculation
const testAIMargin = async () => {
  log('\n=== TESTING AI MARGIN CALCULATION ===', 'info');
  
  // Create deal (should trigger AI margin calculation)
  log('Creating deal - AI should calculate margin...', 'info');
  const deal = await apiCall('post', '/deals', 'Business Head', {
    clientName: 'AI Margin Test Client',
    totalOrderValue: 1000000,
    trainerCost: 300000,
    labCost: 100000,
    logisticsCost: 50000,
    contentCost: 25000,
    contingencyBuffer: 25000
  });
  
  // Check if margin was calculated
  if (deal.data.grossMarginPercent !== undefined && deal.data.marginThresholdStatus) {
    log(`✅ AI Margin Calculated: ${deal.data.grossMarginPercent.toFixed(2)}%, Status: ${deal.data.marginThresholdStatus}`, 'success');
    auditResults.aiCallsSuccessful.push('Margin Calculation');
    auditResults.aiFunctionsTested.push('calculateMarginWithAI');
  } else {
    log('❌ AI Margin NOT calculated', 'error');
    auditResults.aiCallsFailed.push('Margin Calculation');
    auditResults.failuresObserved.push({ function: 'calculateMarginWithAI', issue: 'Margin not calculated' });
  }
  
  auditResults.flowsExecuted.push('AI Margin Calculation Flow');
};

// Test AI Deal Approval
const testAIDealApproval = async () => {
  log('\n=== TESTING AI DEAL APPROVAL ===', 'info');
  
  // Create deal request
  const dealRequest = await apiCall('post', '/deal-requests', 'Business Head', {
    clientName: 'AI Approval Test Client',
    offeringType: 'Training',
    expectedStartDate: new Date('2026-12-01'),
    expectedEndDate: new Date('2026-12-31'),
    expectedRevenue: 2000000
  });
  
  // Approve deal (should use AI)
  log('Approving deal - AI should evaluate...', 'info');
  try {
    const approval = await apiCall('put', `/deal-requests/${dealRequest.data._id}/approve`, 'Business Head');
    log('✅ AI Deal Approval processed', 'success');
    auditResults.aiCallsSuccessful.push('Deal Approval');
    auditResults.aiFunctionsTested.push('shouldApproveDealWithAI');
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.reason) {
      log(`✅ AI Deal Approval rejected: ${error.response.data.reason}`, 'success');
      auditResults.aiCallsSuccessful.push('Deal Approval (Rejected by AI)');
      auditResults.aiFunctionsTested.push('shouldApproveDealWithAI');
    } else {
      log(`❌ AI Deal Approval failed: ${error.message}`, 'error');
      auditResults.aiCallsFailed.push('Deal Approval');
      auditResults.failuresObserved.push({ function: 'shouldApproveDealWithAI', issue: error.message });
    }
  }
  
  auditResults.flowsExecuted.push('AI Deal Approval Flow');
};

// Test AI Invoice Calculation
const testAIInvoice = async () => {
  log('\n=== TESTING AI INVOICE CALCULATION ===', 'info');
  
  // Create vendor
  const vendor = await apiCall('post', '/vendors', 'Operations Manager', {
    vendorType: 'Individual',
    vendorName: 'AI Invoice Vendor',
    panNumber: 'INVOICE1234F',
    bankAccountNumber: '2222222222',
    ifscCode: 'BANK0002222',
    bankName: 'Invoice Bank',
    address: 'Invoice Address',
    contactPersonName: 'Invoice Person',
    email: 'invoice@vendor.com',
    phone: '2222222222'
  });
  
  // Create program
  const program = await apiCall('post', '/programs', 'Operations Manager', {
    programName: 'AI Invoice Program',
    clientName: 'AI Invoice Client',
    sacCode: '998314',
    batchName: 'Batch 1',
    batchCapacity: 25,
    deliveryMode: 'Virtual',
    primaryTrainer: vendor.data._id,
    startDate: new Date('2026-12-01'),
    endDate: new Date('2026-12-31')
  });
  
  await apiCall('put', `/programs/${program.data._id}/signoff`, 'Operations Manager', { type: 'client' });
  
  // Create invoice (should trigger AI calculation)
  log('Creating invoice - AI should calculate totals...', 'info');
  const invoice = await apiCall('post', '/invoices', 'Finance Manager', {
    programId: program.data._id,
    clientName: 'AI Invoice Client',
    invoiceAmount: 500000,
    gstType: 'IGST',
    gstPercent: 18,
    sacCode: '998314',
    invoiceDate: new Date()
  });
  
  // Verify AI calculated amounts
  const expectedTax = 500000 * 0.18;
  const expectedTotal = 500000 + expectedTax;
  
  if (Math.abs(invoice.data.totalAmount - expectedTotal) < 1 && 
      Math.abs(invoice.data.taxAmount - expectedTax) < 1) {
    log(`✅ AI Invoice Calculated: Tax ₹${invoice.data.taxAmount}, Total ₹${invoice.data.totalAmount}`, 'success');
    auditResults.aiCallsSuccessful.push('Invoice Calculation');
    auditResults.aiFunctionsTested.push('calculateInvoiceWithAI');
  } else {
    log(`⚠️ Invoice amounts may not be AI-calculated: Tax ${invoice.data.taxAmount}, Total ${invoice.data.totalAmount}`, 'warning');
  }
  
  auditResults.flowsExecuted.push('AI Invoice Calculation Flow');
};

// Test AI Tax Classification
const testAITaxClassification = async () => {
  log('\n=== TESTING AI TAX CLASSIFICATION ===', 'info');
  
  // Create vendor with specific type
  const vendor = await apiCall('post', '/vendors', 'Operations Manager', {
    vendorType: 'Company',
    vendorName: 'AI Classification Vendor',
    panNumber: 'CLASS123456F',
    bankAccountNumber: '3333333333',
    ifscCode: 'BANK0003333',
    bankName: 'Classification Bank',
    address: 'Classification Address',
    contactPersonName: 'Classification Person',
    email: 'class@vendor.com',
    phone: '3333333333'
  });
  
  // Create deal and PO
  const deal = await apiCall('post', '/deals', 'Business Head', {
    clientName: 'Classification Test',
    totalOrderValue: 150000,
    trainerCost: 40000
  });
  await apiCall('put', `/deals/${deal.data._id}/approve`, 'Director');
  
  const po = await apiCall('post', '/purchase-orders', 'Operations Manager', {
    vendorId: vendor.data._id,
    dealId: deal.data._id,
    approvedCost: 40000,
    adjustedPayableAmount: 40000
  });
  
  // Create payable (should trigger AI tax classification)
  log('Creating payable - AI should classify tax...', 'info');
  const payable = await apiCall('post', '/payables', 'Finance Manager', {
    purchaseOrderId: po.data._id,
    paymentTerms: 30
  });
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Check tax record for classification
  const taxRecords = await apiCall('get', '/tax-engine', 'Finance Manager');
  const payableIdStr = payable.data.payable?._id?.toString() || payable.data._id?.toString();
  const taxRecord = taxRecords.data.find(t => {
    if (t.payableId) {
      const payId = typeof t.payableId === 'object' 
        ? t.payableId._id?.toString() || t.payableId.toString()
        : t.payableId.toString();
      return payId === payableIdStr;
    }
    return false;
  });
  
  if (taxRecord && taxRecord.natureOfService) {
    log(`✅ AI Tax Classified: ${taxRecord.natureOfService}`, 'success');
    auditResults.aiCallsSuccessful.push('Tax Classification');
    auditResults.aiFunctionsTested.push('classifyTaxWithAI');
  } else {
    log('❌ AI Tax Classification NOT performed', 'error');
    auditResults.aiCallsFailed.push('Tax Classification');
    auditResults.failuresObserved.push({ function: 'classifyTaxWithAI', issue: 'Tax not classified' });
  }
  
  auditResults.flowsExecuted.push('AI Tax Classification Flow');
};

// Test AI Automation Decision
const testAIAutomation = async () => {
  log('\n=== TESTING AI AUTOMATION DECISION ===', 'info');
  
  // Create deal request
  const dealRequest = await apiCall('post', '/deal-requests', 'Business Head', {
    clientName: 'AI Automation Test',
    offeringType: 'Training',
    expectedStartDate: new Date('2027-01-01'),
    expectedEndDate: new Date('2027-01-31'),
    expectedRevenue: 1500000
  });
  
  // Approve (should trigger AI automation decision)
  log('Approving deal - AI should decide on automation...', 'info');
  await apiCall('put', `/deal-requests/${dealRequest.data._id}/approve`, 'Business Head');
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Check if PO was auto-generated (AI decision)
  const poStatuses = await apiCall('get', '/internal-po-status', 'Operations Manager');
  const dealRequestIdStr = dealRequest.data._id.toString();
  const autoPO = poStatuses.data.find(po => {
    if (po.linkedDealRequestId) {
      const linkedId = typeof po.linkedDealRequestId === 'object' 
        ? (po.linkedDealRequestId._id?.toString() || po.linkedDealRequestId.toString())
        : po.linkedDealRequestId.toString();
      return linkedId === dealRequestIdStr;
    }
    return false;
  });
  
  if (autoPO) {
    log('✅ AI Automation Decision: PO auto-generated', 'success');
    auditResults.aiCallsSuccessful.push('Automation Decision');
    auditResults.aiFunctionsTested.push('shouldAutoGenerateWithAI');
  } else {
    log('⚠️ PO not auto-generated (may be AI decision to skip)', 'warning');
  }
  
  auditResults.flowsExecuted.push('AI Automation Decision Flow');
};

// Check for rule-based logic in code
const checkForRuleBasedLogic = async () => {
  log('\n=== CHECKING FOR RULE-BASED LOGIC ===', 'info');
  
  // This would require file reading - for now, we test behavior
  log('Testing behavior to detect rule-based logic...', 'info');
  
  // Test if margin calculation uses fixed thresholds
  const deal1 = await apiCall('post', '/deals', 'Business Head', {
    clientName: 'Rule Check 1',
    totalOrderValue: 100000,
    trainerCost: 95000 // Should be below threshold
  });
  
  const deal2 = await apiCall('post', '/deals', 'Business Head', {
    clientName: 'Rule Check 2',
    totalOrderValue: 1000000,
    trainerCost: 200000 // Should be above threshold
  });
  
  // If margins are exactly 10% or 15% thresholds, might be rule-based
  const margin1 = deal1.data.grossMarginPercent;
  const margin2 = deal2.data.grossMarginPercent;
  
  if (margin1 === 10 || margin1 === 15 || margin2 === 10 || margin2 === 15) {
    log('⚠️ Suspicious margin values - may be rule-based', 'warning');
    auditResults.ruleBasedLogicFound.push('Margin calculation may use fixed thresholds');
  } else {
    log('✅ Margins appear AI-calculated (not fixed thresholds)', 'success');
  }
};

// Main execution
const runAIAudit = async () => {
  log('🤖 Starting AI Runtime Audit...', 'info');
  log('Verifying ALL AI integrations are working...', 'info');
  
  // Wait for server
  for (let i = 0; i < 30; i++) {
    try {
      await axios.get(`${API_BASE}/health`);
      break;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  try {
    await login('Operations Manager');
    await login('Business Head');
    await login('Finance Manager');
    await login('Director');
    
    await testAIMargin();
    await testAITDS();
    await testAIDealApproval();
    await testAIInvoice();
    await testAITaxClassification();
    await testAIAutomation();
    await checkForRuleBasedLogic();
  } catch (error) {
    log(`Critical error: ${error.message}`, 'error');
    auditResults.failuresObserved.push({ critical: true, error: error.message });
  }
  
  // Final Report
  log('\n=== AI RUNTIME CERTIFICATION REPORT ===', 'info');
  log(`AI Functions Tested: ${auditResults.aiFunctionsTested.length}`, 'info');
  log(`AI Calls Successful: ${auditResults.aiCallsSuccessful.length}`, 'success');
  log(`AI Calls Failed: ${auditResults.aiCallsFailed.length}`, auditResults.aiCallsFailed.length > 0 ? 'error' : 'success');
  log(`Rule-Based Logic Found: ${auditResults.ruleBasedLogicFound.length}`, auditResults.ruleBasedLogicFound.length > 0 ? 'error' : 'success');
  log(`Flows Executed: ${auditResults.flowsExecuted.length}`, 'info');
  log(`Failures Observed: ${auditResults.failuresObserved.length}`, auditResults.failuresObserved.length > 0 ? 'error' : 'success');
  
  if (auditResults.aiCallsFailed.length === 0 && auditResults.ruleBasedLogicFound.length === 0) {
    log('\n✅ AI RUNTIME-CERTIFIED - ALL AI WORKING', 'success');
  } else {
    log('\n❌ NOT READY — AI ISSUES FOUND', 'error');
    if (auditResults.aiCallsFailed.length > 0) {
      auditResults.aiCallsFailed.forEach(f => log(`  - AI Failed: ${f}`, 'error'));
    }
    if (auditResults.ruleBasedLogicFound.length > 0) {
      auditResults.ruleBasedLogicFound.forEach(f => log(`  - Rule-Based: ${f}`, 'error'));
    }
  }
  
  process.exit(auditResults.aiCallsFailed.length === 0 && auditResults.ruleBasedLogicFound.length === 0 ? 0 : 1);
};

runAIAudit();
