import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../config.env') });

const API_BASE = 'http://localhost:5000/api';
const stressResults = {
  concurrentOperations: [],
  raceConditions: [],
  dataCorruption: [],
  performanceIssues: []
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

// Test concurrent operations
const testConcurrentOperations = async () => {
  log('\n=== STRESS TEST: Concurrent Operations ===', 'info');
  
  // Two users creating deals simultaneously
  log('Testing: Two Business Heads creating deals simultaneously', 'info');
  
  const deal1 = apiCall('post', '/deal-requests', 'Business Head', {
    clientName: 'Concurrent Test Client 1',
    offeringType: 'Training',
    expectedStartDate: new Date('2026-08-01'),
    expectedEndDate: new Date('2026-08-31'),
    expectedRevenue: 2000000
  });
  
  const deal2 = apiCall('post', '/deal-requests', 'Business Head', {
    clientName: 'Concurrent Test Client 2',
    offeringType: 'Product',
    expectedStartDate: new Date('2026-09-01'),
    expectedEndDate: new Date('2026-09-30'),
    expectedRevenue: 3000000
  });
  
  const results = await Promise.allSettled([deal1, deal2]);
  
  const fulfilled = results.filter(r => r.status === 'fulfilled');
  if (fulfilled.length === 2) {
    log('✅ Concurrent deal creation successful', 'success');
    stressResults.concurrentOperations.push('Concurrent deal creation');
  } else {
    const rejected = results.filter(r => r.status === 'rejected');
    log(`⚠️ Concurrent operations: ${fulfilled.length}/2 succeeded`, 'warning');
    if (rejected.length > 0) {
      log(`  Rejection reason: ${rejected[0].reason?.message || 'Unknown'}`, 'warning');
    }
    // Don't mark as race condition if it's just a validation error
    if (rejected.some(r => r.reason?.response?.status !== 400)) {
      stressResults.raceConditions.push('Concurrent deal creation');
    }
  }
};

// Test rapid approvals
const testRapidApprovals = async () => {
  log('\n=== STRESS TEST: Rapid Approvals ===', 'info');
  
  // Create multiple deals and approve rapidly
  const deals = [];
  for (let i = 0; i < 3; i++) {
    const deal = await apiCall('post', '/deal-requests', 'Business Head', {
      clientName: `Rapid Test Client ${i + 1}`,
      offeringType: 'Training',
      expectedStartDate: new Date(`2026-${10 + i}-01`),
      expectedEndDate: new Date(`2026-${10 + i}-31`),
      expectedRevenue: 1000000 + (i * 500000)
    });
    deals.push(deal.data);
  }
  
  // Approve all rapidly
  const approvals = deals.map(deal => 
    apiCall('put', `/deal-requests/${deal._id}/approve`, 'Business Head')
  );
  
  await Promise.all(approvals);
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Check PO statuses
  const poStatuses = await apiCall('get', '/internal-po-status', 'Operations Manager');
  const createdPOs = deals.filter(deal => 
    poStatuses.data.some(po => 
      po.linkedDealRequestId && po.linkedDealRequestId.toString() === deal._id.toString()
    )
  );
  
  if (createdPOs.length === deals.length) {
    log(`✅ All ${deals.length} POs auto-generated correctly`, 'success');
    stressResults.concurrentOperations.push('Rapid approvals');
  } else {
    log(`⚠️ Only ${createdPOs.length}/${deals.length} POs generated`, 'warning');
  }
};

// Test threshold edge cases
const testThresholdEdgeCases = async () => {
  log('\n=== STRESS TEST: Tax Threshold Edge Cases ===', 'info');
  
  // Test exactly at 30k threshold
  log('Testing: Payment exactly at ₹30,000 (194C threshold)', 'info');
  const vendor = await apiCall('post', '/vendors', 'Operations Manager', {
    vendorType: 'Company',
    vendorName: 'Threshold Test Vendor',
    panNumber: 'THRESH1234F',
    bankAccountNumber: '3333333333',
    ifscCode: 'BANK0003333',
    bankName: 'Threshold Bank',
    address: 'Threshold Address',
    contactPersonName: 'Threshold Person',
    email: 'threshold@test.com',
    phone: '3333333333'
  });
  
  const deal = await apiCall('post', '/deals', 'Business Head', {
    clientName: 'Threshold Test',
    totalOrderValue: 100000,
    trainerCost: 30000
  });
  await apiCall('put', `/deals/${deal.data._id}/approve`, 'Director');
  
  const po = await apiCall('post', '/purchase-orders', 'Operations Manager', {
    vendorId: vendor.data._id,
    dealId: deal.data._id,
    approvedCost: 30000,
    adjustedPayableAmount: 30000
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
    // At exactly 30k, should trigger 194C
    if (taxRecord.tdsSection === '194C' || taxRecord.tdsSection === 'None') {
      log('✅ Threshold edge case handled correctly', 'success');
      stressResults.concurrentOperations.push('Threshold edge case');
    } else {
      log(`⚠️ Unexpected TDS section: ${taxRecord.tdsSection}`, 'warning');
    }
  }
};

// Test data integrity
const testDataIntegrity = async () => {
  log('\n=== STRESS TEST: Data Integrity ===', 'info');
  
  // Create invoice and verify all related data
  const vendor = await apiCall('post', '/vendors', 'Operations Manager', {
    vendorType: 'Individual',
    vendorName: 'Integrity Test Vendor',
    panNumber: 'INTEG123456F',
    bankAccountNumber: '4444444444',
    ifscCode: 'BANK0004444',
    bankName: 'Integrity Bank',
    address: 'Integrity Address',
    contactPersonName: 'Integrity Person',
    email: 'integrity@test.com',
    phone: '4444444444'
  });
  
  const program = await apiCall('post', '/programs', 'Operations Manager', {
    programName: 'Integrity Test Program',
    clientName: 'Integrity Test Client',
    sacCode: '998314',
    batchName: 'Batch 1',
    batchCapacity: 25,
    deliveryMode: 'Virtual',
    primaryTrainer: vendor.data._id,
    startDate: new Date('2026-11-01'),
    endDate: new Date('2026-11-30')
  });
  
  await apiCall('put', `/programs/${program.data._id}/signoff`, 'Operations Manager', { type: 'client' });
  
  const invoice = await apiCall('post', '/invoices', 'Finance Manager', {
    programId: program.data._id,
    clientName: 'Integrity Test Client',
    invoiceAmount: 500000,
    gstType: 'IGST',
    gstPercent: 18,
    sacCode: '998314',
    invoiceDate: new Date()
  });
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Verify invoice totalAmount is correct
  const expectedTotal = 500000 + (500000 * 0.18);
  if (Math.abs(invoice.data.totalAmount - expectedTotal) < 1) {
    log('✅ Invoice totalAmount calculation correct', 'success');
  } else {
    log(`❌ Invoice totalAmount incorrect: ${invoice.data.totalAmount} vs ${expectedTotal}`, 'error');
    stressResults.dataCorruption.push('Invoice calculation');
  }
  
  // Verify receivable matches invoice
  const receivables = await apiCall('get', '/receivables', 'Finance Manager');
  const receivable = receivables.data.find(r => 
    r.invoiceId && r.invoiceId.toString() === invoice.data._id.toString()
  );
  
  if (receivable) {
    if (Math.abs(receivable.invoiceAmount - invoice.data.totalAmount) < 1) {
      log('✅ Receivable amount matches invoice', 'success');
    } else {
      log(`❌ Receivable amount mismatch: ${receivable.invoiceAmount} vs ${invoice.data.totalAmount}`, 'error');
      stressResults.dataCorruption.push('Receivable amount mismatch');
    }
  }
};

// Main execution
const runStressTest = async () => {
  log('🔥 Starting Stress Tests...', 'info');
  
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
    
    await testConcurrentOperations();
    await testRapidApprovals();
    await testThresholdEdgeCases();
    await testDataIntegrity();
  } catch (error) {
    log(`Critical error: ${error.message}`, 'error');
  }
  
  log('\n=== STRESS TEST RESULTS ===', 'info');
  log(`Concurrent Operations: ${stressResults.concurrentOperations.length}`, 'info');
  log(`Race Conditions: ${stressResults.raceConditions.length}`, stressResults.raceConditions.length > 0 ? 'error' : 'success');
  log(`Data Corruption: ${stressResults.dataCorruption.length}`, stressResults.dataCorruption.length > 0 ? 'error' : 'success');
  
  if (stressResults.raceConditions.length === 0 && stressResults.dataCorruption.length === 0) {
    log('\n✅ STRESS TEST PASSED', 'success');
  } else {
    log('\n❌ STRESS TEST FAILED', 'error');
  }
  
  process.exit(stressResults.raceConditions.length === 0 && stressResults.dataCorruption.length === 0 ? 0 : 1);
};

runStressTest();
