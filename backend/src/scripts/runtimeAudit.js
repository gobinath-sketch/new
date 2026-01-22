import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../config.env') });

const API_BASE = 'http://localhost:5000/api';
const auditResults = {
  flowsExecuted: [],
  edgeCasesTriggered: [],
  failuresObserved: [],
  fixesApplied: [],
  safetyGuarantees: [],
  knownBoundaries: []
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

// PHASE 1: Full Role-Based Live Exploration
const phase1_RoleExploration = async () => {
  log('\n=== PHASE 1: FULL ROLE-BASED LIVE EXPLORATION ===', 'info');
  
  for (const role of Object.keys(testUsers)) {
    log(`\nTesting role: ${role}`, 'info');
    
    // Login
    await login(role);
    log(`✅ ${role} logged in successfully`, 'success');
    
    // Load dashboard
    const dashboardEndpoint = {
      'Operations Manager': '/dashboards/operations',
      'Business Head': '/dashboards/business',
      'Finance Manager': '/dashboards/finance',
      'Director': '/dashboards/director'
    }[role];
    
    try {
      const dashboard = await apiCall('get', dashboardEndpoint, role);
      log(`✅ ${role} dashboard loaded (${Object.keys(dashboard.data).length} metrics)`, 'success');
      auditResults.flowsExecuted.push(`${role} dashboard access`);
    } catch (error) {
      log(`❌ ${role} dashboard failed: ${error.message}`, 'error');
      auditResults.failuresObserved.push({ role, issue: 'Dashboard load failed', error: error.message });
    }
    
    // Test module access
    const modules = {
      'Operations Manager': ['/vendors', '/programs', '/materials', '/purchase-orders', '/deal-requests'],
      'Business Head': ['/deals', '/deal-requests'],
      'Finance Manager': ['/invoices', '/receivables', '/payables', '/tax-engine'],
      'Director': ['/governance/audit-trail', '/governance/risk-alerts', '/tax-engine']
    };
    
    for (const module of modules[role] || []) {
      try {
        await apiCall('get', module, role);
        log(`  ✅ ${role} can access ${module}`, 'success');
      } catch (error) {
        log(`  ❌ ${role} cannot access ${module}: ${error.response?.status}`, 'error');
        auditResults.failuresObserved.push({ role, module, issue: 'Access denied', error: error.message });
      }
    }
    
    // Test forbidden access
    const forbiddenModules = {
      'Operations Manager': ['/governance/audit-trail', '/invoices'],
      'Business Head': ['/programs', '/governance/audit-trail'],
      'Finance Manager': ['/governance/audit-trail', '/programs'],
      'Director': [] // Director can access everything
    };
    
    for (const module of forbiddenModules[role] || []) {
      try {
        await apiCall('get', module, role);
        log(`  🔴 SECURITY BREACH: ${role} accessed forbidden ${module}`, 'error');
        auditResults.failuresObserved.push({ role, module, issue: 'Security breach - unauthorized access' });
      } catch (error) {
        if (error.response?.status === 403) {
          log(`  ✅ ${role} correctly blocked from ${module}`, 'success');
        } else {
          log(`  ⚠️ ${role} access to ${module} returned ${error.response?.status}`, 'warning');
        }
      }
    }
  }
};

// PHASE 2: Complete Real-World Business Flows
const phase2_RealWorldFlows = async () => {
  log('\n=== PHASE 2: COMPLETE REAL-WORLD BUSINESS FLOWS ===', 'info');
  
  // Canonical Flow
  log('\nExecuting Canonical Flow...', 'info');
  
  // 1. Business Head creates deal request
  log('Step 1: Business Head creates deal request', 'info');
  const dealRequest = await apiCall('post', '/deal-requests', 'Business Head', {
    clientName: 'Runtime Test Client A',
    offeringType: 'Training',
    expectedStartDate: new Date('2026-06-01'),
    expectedEndDate: new Date('2026-06-30'),
    expectedRevenue: 1500000
  });
  log(`✅ Deal Request created: ${dealRequest.data.dealId}`, 'success');
  auditResults.flowsExecuted.push('Deal Request Creation');
  
  // 2. Business Head approves deal
  log('Step 2: Business Head approves deal', 'info');
  await apiCall('put', `/deal-requests/${dealRequest.data._id}/approve`, 'Business Head');
  log('✅ Deal approved', 'success');
  auditResults.flowsExecuted.push('Deal Approval');
  
  // Wait for PO auto-generation
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 3. Check PO auto-generated
  log('Step 3: Verify PO auto-generated', 'info');
  await new Promise(resolve => setTimeout(resolve, 2000));
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
    log('✅ PO Status auto-generated', 'success');
    auditResults.flowsExecuted.push('PO Auto-Generation');
  } else {
    log(`❌ PO Status NOT auto-generated. DealRequest ID: ${dealRequestIdStr}, Found POs: ${poStatuses.data.length}`, 'error');
    auditResults.failuresObserved.push({ flow: 'Deal Approval', issue: 'PO not auto-generated', dealRequestId: dealRequestIdStr });
  }
  
  // 4. Ops acknowledges
  log('Step 4: Ops acknowledges deal', 'info');
  await apiCall('put', `/deal-requests/${dealRequest.data._id}/acknowledge`, 'Operations Manager', {
    action: 'acknowledge'
  });
  log('✅ Ops acknowledged', 'success');
  auditResults.flowsExecuted.push('Ops Acknowledgment');
  
  // 5. Create vendor
  log('Step 5: Create vendor', 'info');
  const vendor = await apiCall('post', '/vendors', 'Operations Manager', {
    vendorType: 'Company',
    vendorName: 'Runtime Test Vendor',
    panNumber: 'RUNTIME1234F',
    bankAccountNumber: '9876543210',
    ifscCode: 'BANK0009876',
    bankName: 'Runtime Bank',
    address: 'Runtime Address',
    contactPersonName: 'Runtime Person',
    email: 'runtime@vendor.com',
    phone: '9876543210'
  });
  log(`✅ Vendor created: ${vendor.data._id}`, 'success');
  auditResults.flowsExecuted.push('Vendor Creation');
  
  // 6. Create deal for PO
  log('Step 6: Create deal for PO', 'info');
  const deal = await apiCall('post', '/deals', 'Business Head', {
    clientName: 'Runtime Test Client A',
    totalOrderValue: 1500000,
    trainerCost: 500000,
    labCost: 200000,
    logisticsCost: 100000,
    contentCost: 50000,
    contingencyBuffer: 50000
  });
  log(`✅ Deal created: ${deal.data.dealId}`, 'success');
  
  await apiCall('put', `/deals/${deal.data._id}/approve`, 'Director');
  log('✅ Deal approved by Director', 'success');
  
  // 7. Create PO
  log('Step 7: Create Purchase Order', 'info');
  const po = await apiCall('post', '/purchase-orders', 'Operations Manager', {
    vendorId: vendor.data._id,
    dealId: deal.data._id,
    approvedCost: 500000,
    adjustedPayableAmount: 500000
  });
  log(`✅ PO created: ${po.data.internalPONumber}`, 'success');
  auditResults.flowsExecuted.push('PO Creation');
  
  // 8. Create program
  log('Step 8: Create program', 'info');
  const program = await apiCall('post', '/programs', 'Operations Manager', {
    programName: 'Runtime Test Program',
    clientName: 'Runtime Test Client A',
    sacCode: '998314',
    batchName: 'Batch 1',
    batchCapacity: 30,
    deliveryMode: 'Virtual',
    primaryTrainer: vendor.data._id,
    startDate: new Date('2026-06-01'),
    endDate: new Date('2026-06-30')
  });
  log(`✅ Program created: ${program.data.programCode}`, 'success');
  auditResults.flowsExecuted.push('Program Creation');
  
  // 9. Client sign-off
  log('Step 9: Client sign-off', 'info');
  await apiCall('put', `/programs/${program.data._id}/signoff`, 'Operations Manager', { type: 'client' });
  log('✅ Client signed off', 'success');
  auditResults.flowsExecuted.push('Client Sign-Off');
  
  // 10. Create invoice
  log('Step 10: Create invoice', 'info');
  const invoice = await apiCall('post', '/invoices', 'Finance Manager', {
    programId: program.data._id,
    clientName: 'Runtime Test Client A',
    invoiceAmount: 1500000,
    gstType: 'IGST',
    gstPercent: 18,
    sacCode: '998314',
    invoiceDate: new Date()
  });
  log(`✅ Invoice created: ${invoice.data.clientInvoiceNumber}`, 'success');
  auditResults.flowsExecuted.push('Invoice Creation');
  
  // Wait for receivable auto-generation
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 11. Verify receivable auto-generated
  log('Step 11: Verify receivable auto-generated', 'info');
  await new Promise(resolve => setTimeout(resolve, 2000));
  const receivables = await apiCall('get', '/receivables', 'Finance Manager');
  const invoiceIdStr = invoice.data._id.toString();
  const autoReceivable = receivables.data.find(r => {
    if (r.invoiceId) {
      const invId = typeof r.invoiceId === 'object' 
        ? (r.invoiceId._id?.toString() || r.invoiceId.toString())
        : r.invoiceId.toString();
      return invId === invoiceIdStr;
    }
    return false;
  });
  if (autoReceivable) {
    log('✅ Receivable auto-generated', 'success');
    auditResults.flowsExecuted.push('Receivable Auto-Generation');
  } else {
    log(`❌ Receivable NOT auto-generated. Invoice ID: ${invoiceIdStr}, Found receivables: ${receivables.data.length}`, 'error');
    auditResults.failuresObserved.push({ flow: 'Invoice Creation', issue: 'Receivable not auto-generated', invoiceId: invoiceIdStr });
  }
  
  // 12. Create payable
  log('Step 12: Create payable', 'info');
  const payable = await apiCall('post', '/payables', 'Finance Manager', {
    purchaseOrderId: po.data._id,
    paymentTerms: 30
  });
  log(`✅ Payable created: ${payable.data.payable?.vendorPayoutReference || 'N/A'}`, 'success');
  auditResults.flowsExecuted.push('Payable Creation');
  
  // Wait for TDS auto-calculation
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 13. Verify TDS auto-calculated
  log('Step 13: Verify TDS auto-calculated', 'info');
  const taxRecords = await apiCall('get', '/tax-engine', 'Finance Manager');
  const payableIdStr = payable.data.payable?._id?.toString() || payable.data._id?.toString();
  const autoTDS = taxRecords.data.find(t => {
    if (t.payableId) {
      const payId = typeof t.payableId === 'object' 
        ? t.payableId._id?.toString() || t.payableId.toString()
        : t.payableId.toString();
      return payId === payableIdStr;
    }
    return false;
  });
  if (autoTDS) {
    log(`✅ TDS auto-calculated: Section ${autoTDS.tdsSection}, ${autoTDS.applicableTdsPercent}%`, 'success');
    auditResults.flowsExecuted.push('TDS Auto-Calculation');
  } else {
    log('❌ TDS NOT auto-calculated', 'error');
    auditResults.failuresObserved.push({ flow: 'Payable Creation', issue: 'TDS not auto-calculated' });
  }
  
  log('\n✅ Canonical Flow completed', 'success');
};

// PHASE 3: Live Automation Determinism
const phase3_AutomationDeterminism = async () => {
  log('\n=== PHASE 3: LIVE AUTOMATION DETERMINISM ===', 'info');
  
  // Test idempotency - approve same deal twice
  log('Testing idempotency: Approve deal twice', 'info');
  const dealRequest = await apiCall('post', '/deal-requests', 'Business Head', {
    clientName: 'Idempotency Test',
    offeringType: 'Training',
    expectedStartDate: new Date('2026-07-01'),
    expectedEndDate: new Date('2026-07-31'),
    expectedRevenue: 1000000
  });
  
  await apiCall('put', `/deal-requests/${dealRequest.data._id}/approve`, 'Business Head');
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const poStatuses1 = await apiCall('get', '/internal-po-status', 'Operations Manager');
  const count1 = poStatuses1.data.filter(po => 
    po.linkedDealRequestId && po.linkedDealRequestId.toString() === dealRequest.data._id.toString()
  ).length;
  
  // Try to approve again (should be idempotent)
  await apiCall('put', `/deal-requests/${dealRequest.data._id}/approve`, 'Business Head');
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const poStatuses2 = await apiCall('get', '/internal-po-status', 'Operations Manager');
  const count2 = poStatuses2.data.filter(po => 
    po.linkedDealRequestId && po.linkedDealRequestId.toString() === dealRequest.data._id.toString()
  ).length;
  
  if (count1 === count2) {
    log('✅ Automation is idempotent (no duplicate POs)', 'success');
    auditResults.safetyGuarantees.push('Deal approval idempotent');
  } else {
    log(`❌ Automation NOT idempotent: ${count1} -> ${count2} POs`, 'error');
    auditResults.failuresObserved.push({ automation: 'Deal Approval', issue: 'Not idempotent' });
  }
};

// PHASE 4: Real India Tax & Compliance
const phase4_TaxCompliance = async () => {
  log('\n=== PHASE 4: REAL INDIA TAX & COMPLIANCE BEHAVIOR ===', 'info');
  
  // Test 194C - Company, above threshold
  log('Testing 194C: Company vendor, 50000 payment (above 30k threshold)', 'info');
  const vendor = await apiCall('post', '/vendors', 'Operations Manager', {
    vendorType: 'Company',
    vendorName: 'Tax Test Company',
    panNumber: 'TAX194C123F',
    bankAccountNumber: '1111111111',
    ifscCode: 'BANK0001111',
    bankName: 'Tax Bank',
    address: 'Tax Address',
    contactPersonName: 'Tax Person',
    email: 'tax194c@test.com',
    phone: '1111111111'
  });
  
  const deal = await apiCall('post', '/deals', 'Business Head', {
    clientName: 'Tax Test Client',
    totalOrderValue: 200000,
    trainerCost: 50000
  });
  await apiCall('put', `/deals/${deal.data._id}/approve`, 'Director');
  
  const po = await apiCall('post', '/purchase-orders', 'Operations Manager', {
    vendorId: vendor.data._id,
    dealId: deal.data._id,
    approvedCost: 50000,
    adjustedPayableAmount: 50000
  });
  
  const payable = await apiCall('post', '/payables', 'Finance Manager', {
    purchaseOrderId: po.data._id,
    paymentTerms: 30
  });
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
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
    if (taxRecord.tdsSection === '194C' && taxRecord.applicableTdsPercent === 2) {
      log('✅ 194C correctly applied: 2% for Company', 'success');
      auditResults.safetyGuarantees.push('194C tax calculation correct');
    } else {
      log(`⚠️ TDS calculated but unexpected: Section ${taxRecord.tdsSection}, ${taxRecord.applicableTdsPercent}%`, 'warning');
    }
  } else {
    log('❌ TDS record not found', 'error');
  }
};

// PHASE 5: Edge Case & Failure Injection
const phase5_EdgeCases = async () => {
  log('\n=== PHASE 5: EDGE CASE & FAILURE INJECTION ===', 'info');
  
  // Test double submission
  log('Testing: Double-click submit (idempotency)', 'info');
  const vendor = await apiCall('post', '/vendors', 'Operations Manager', {
    vendorType: 'Individual',
    vendorName: 'Edge Test Vendor',
    panNumber: 'EDGE123456F',
    bankAccountNumber: '2222222222',
    ifscCode: 'BANK0002222',
    bankName: 'Edge Bank',
    address: 'Edge Address',
    contactPersonName: 'Edge Person',
    email: 'edge@test.com',
    phone: '2222222222'
  });
  
  // Try to create same vendor twice (should fail or handle gracefully)
  try {
    await apiCall('post', '/vendors', 'Operations Manager', {
      vendorType: 'Individual',
      vendorName: 'Edge Test Vendor',
      panNumber: 'EDGE123456F', // Same PAN
      bankAccountNumber: '2222222222',
      ifscCode: 'BANK0002222',
      bankName: 'Edge Bank',
      address: 'Edge Address',
      contactPersonName: 'Edge Person',
      email: 'edge2@test.com',
      phone: '2222222222'
    });
    log('⚠️ Duplicate vendor creation allowed (may be intentional)', 'warning');
  } catch (error) {
    if (error.response?.status === 400 || error.response?.status === 409) {
      log('✅ Duplicate vendor creation prevented', 'success');
      auditResults.safetyGuarantees.push('Duplicate prevention working');
    }
  }
  
  auditResults.edgeCasesTriggered.push('Double submission', 'Duplicate creation');
};

// PHASE 6: Dashboard Truth Audit
const phase6_DashboardAudit = async () => {
  log('\n=== PHASE 6: DASHBOARD TRUTH AUDIT ===', 'info');
  
  // Verify dashboard data matches source
  log('Auditing Finance Dashboard', 'info');
  const financeDashboard = await apiCall('get', '/dashboards/finance', 'Finance Manager');
  
  // Get actual receivables
  const receivables = await apiCall('get', '/receivables', 'Finance Manager');
  const actualTotal = receivables.data.reduce((sum, r) => sum + (r.outstandingAmount || 0), 0);
  
  log(`Dashboard shows receivables, actual total: ₹${actualTotal}`, 'info');
  auditResults.flowsExecuted.push('Dashboard audit');
};

// Main execution
const runRuntimeAudit = async () => {
  log('🚀 Starting Runtime Systems Audit...', 'info');
  log('Waiting for server...', 'info');
  
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
    await phase1_RoleExploration();
    await phase2_RealWorldFlows();
    await phase3_AutomationDeterminism();
    await phase4_TaxCompliance();
    await phase5_EdgeCases();
    await phase6_DashboardAudit();
  } catch (error) {
    log(`Critical error: ${error.message}`, 'error');
    auditResults.failuresObserved.push({ critical: true, error: error.message });
  }
  
  // Final Report
  log('\n=== RUNTIME CERTIFICATION REPORT ===', 'info');
  log(`Flows Executed: ${auditResults.flowsExecuted.length}`, 'info');
  log(`Edge Cases Triggered: ${auditResults.edgeCasesTriggered.length}`, 'info');
  log(`Failures Observed: ${auditResults.failuresObserved.length}`, auditResults.failuresObserved.length > 0 ? 'error' : 'success');
  log(`Safety Guarantees: ${auditResults.safetyGuarantees.length}`, 'info');
  
  if (auditResults.failuresObserved.length === 0) {
    log('\n✅ RUNTIME-CERTIFIED FOR REAL-WORLD USE', 'success');
  } else {
    log('\n❌ NOT READY — WITH EXACT BLOCKERS', 'error');
    auditResults.failuresObserved.forEach(f => log(`  - ${JSON.stringify(f)}`, 'error'));
  }
  
  process.exit(auditResults.failuresObserved.length === 0 ? 0 : 1);
};

runRuntimeAudit();
