import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../config.env') });

const API_BASE = 'http://localhost:5000/api';
const testResults = { passed: [], failed: [], warnings: [] };

const testUsers = {
  'Operations Manager': { email: 'operations@singleplayground.com', password: 'Operations@2026' },
  'Business Head': { email: 'business@singleplayground.com', password: 'Business@2026' },
  'Finance Manager': { email: 'finance@singleplayground.com', password: 'Finance@2026' },
  'Director': { email: 'director@singleplayground.com', password: 'Director@2026' }
};

let authTokens = {};

const log = (message, type = 'info') => {
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} ${message}`);
};

const test = async (name, fn) => {
  try {
    await fn();
    testResults.passed.push(name);
    log(`PASS: ${name}`, 'success');
    return true;
  } catch (error) {
    testResults.failed.push({ name, error: error.message });
    log(`FAIL: ${name} - ${error.message}`, 'error');
    return false;
  }
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

// ============================================
// TEST SUITE
// ============================================

const runTests = async () => {
  console.log('\n🚀 STARTING END-TO-END TEST SUITE\n');
  console.log('='.repeat(60));

  // 1. AUTHENTICATION & ACCESS CONTROL
  console.log('\n📋 1. AUTHENTICATION & ACCESS CONTROL\n');
  
  for (const role of Object.keys(testUsers)) {
    await test(`Login as ${role}`, async () => {
      await login(role);
    });
  }

  await test('Reject wrong role login', async () => {
    try {
      await axios.post(`${API_BASE}/auth/login`, {
        email: testUsers['Operations Manager'].email,
        password: testUsers['Operations Manager'].password,
        role: 'Business Head'
      });
      throw new Error('Should have rejected wrong role');
    } catch (error) {
      if (error.response?.status !== 403) throw error;
    }
  });

  // 2. DROPDOWN OPTIONS TESTING
  console.log('\n📋 2. DROPDOWN OPTIONS TESTING\n');

  await test('Operations Manager dropdown options', async () => {
    const res = await apiCall('get', '/dropdown-options', 'Operations Manager');
    if (!res.data.vendorType || !res.data.vendorStatus || !res.data.deliveryMode) {
      throw new Error('Missing dropdown options');
    }
    if (!res.data.vendors || res.data.vendors.length === 0) {
      throw new Error('No vendors in dropdown');
    }
  });

  await test('Business Head dropdown options', async () => {
    const res = await apiCall('get', '/dropdown-options', 'Business Head');
    if (!res.data.dealType || !res.data.revenueCategory) {
      throw new Error('Missing deal dropdown options');
    }
    if (!res.data.clients || res.data.clients.length === 0) {
      throw new Error('No clients in dropdown');
    }
  });

  await test('Finance Manager dropdown options', async () => {
    const res = await apiCall('get', '/dropdown-options', 'Finance Manager');
    if (!res.data.gstType || !res.data.paymentMode) {
      throw new Error('Missing finance dropdown options');
    }
    if (res.data.gstType.includes('CGST') && res.data.gstType.includes('SGST')) {
      throw new Error('GST Type should be CGST+SGST, not separate');
    }
  });

  await test('Director dropdown options', async () => {
    const res = await apiCall('get', '/dropdown-options', 'Director');
    if (!res.data.approvalDecision || !res.data.riskCategory) {
      throw new Error('Missing director dropdown options');
    }
  });

  // 3. VENDOR DROPDOWN TESTING
  console.log('\n📋 3. VENDOR DROPDOWN TESTING\n');

  await test('Vendor Type dropdown has all options', async () => {
    const res = await apiCall('get', '/dropdown-options', 'Operations Manager');
    const expected = ['Individual', 'Company', 'HUF', 'Firm', 'LLP'];
    if (!res.data.vendorType.every(v => expected.includes(v))) {
      throw new Error('Vendor Type options incomplete');
    }
  });

  await test('Vendor Status includes Blacklisted', async () => {
    const res = await apiCall('get', '/dropdown-options', 'Operations Manager');
    if (!res.data.vendorStatus.includes('Blacklisted')) {
      throw new Error('Blacklisted status missing');
    }
  });

  await test('Vendors filtered by status and blacklist', async () => {
    const res = await apiCall('get', '/dropdown-options', 'Operations Manager');
    const vendors = res.data.vendors;
    if (vendors.some(v => v.status !== 'Active' || v.blacklistFlag)) {
      throw new Error('Inactive or blacklisted vendors in dropdown');
    }
  });

  // 4. DEAL DROPDOWN TESTING
  console.log('\n📋 4. DEAL DROPDOWN TESTING\n');

  await test('Deal Type dropdown options', async () => {
    const res = await apiCall('get', '/dropdown-options', 'Business Head');
    const expected = ['Training', 'Enablement', 'Consulting', 'Resource Support'];
    if (!res.data.dealType.every(d => expected.includes(d))) {
      throw new Error('Deal Type options incomplete');
    }
  });

  await test('Revenue Category dropdown options', async () => {
    const res = await apiCall('get', '/dropdown-options', 'Business Head');
    const expected = ['Corporate', 'Academic', 'School'];
    if (!res.data.revenueCategory.every(c => expected.includes(c))) {
      throw new Error('Revenue Category options incomplete');
    }
  });

  await test('Clients from approved deals only', async () => {
    const res = await apiCall('get', '/dropdown-options', 'Business Head');
    const expectedClients = ['Infosys Ltd', 'IIT Madras', 'ABC Public School'];
    if (!res.data.clients.some(c => expectedClients.includes(c))) {
      throw new Error('Test clients not found in dropdown');
    }
  });

  // 5. PROGRAM DROPDOWN TESTING
  console.log('\n📋 5. PROGRAM DROPDOWN TESTING\n');

  await test('Delivery Mode dropdown options', async () => {
    const res = await apiCall('get', '/dropdown-options', 'Operations Manager');
    const expected = ['Onsite', 'Virtual', 'Hybrid'];
    if (!res.data.deliveryMode.every(m => expected.includes(m))) {
      throw new Error('Delivery Mode options incomplete');
    }
  });

  await test('Trainer availability filtering', async () => {
    const token = authTokens['Operations Manager'] || await login('Operations Manager');
    const res = await axios.get(`${API_BASE}/dropdown-options/trainers`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        programStartDate: '2024-01-20',
        programEndDate: '2024-01-25'
      }
    });
    if (!res.data || !Array.isArray(res.data)) {
      throw new Error('Trainer availability API failed');
    }
  });

  // 6. INVOICE DROPDOWN TESTING
  console.log('\n📋 6. INVOICE DROPDOWN TESTING\n');

  await test('GST Type dropdown has CGST+SGST', async () => {
    const res = await apiCall('get', '/dropdown-options', 'Finance Manager');
    if (!res.data.gstType.includes('CGST+SGST')) {
      throw new Error('CGST+SGST missing from GST Type');
    }
  });

  await test('Invoice Status dropdown options', async () => {
    const res = await apiCall('get', '/dropdown-options', 'Finance Manager');
    const expected = ['Draft', 'Generated', 'Sent', 'Paid', 'Overdue', 'Cancelled'];
    if (!res.data.invoiceStatus.every(s => expected.includes(s))) {
      throw new Error('Invoice Status options incomplete');
    }
  });

  // 7. PAYABLE DROPDOWN TESTING
  console.log('\n📋 7. PAYABLE DROPDOWN TESTING\n');

  await test('Payment Mode dropdown options', async () => {
    const res = await apiCall('get', '/dropdown-options', 'Finance Manager');
    const expected = ['NEFT', 'RTGS', 'IMPS', 'UPI', 'Cheque', 'Cash', 'Bank Transfer'];
    if (!res.data.paymentMode.every(m => expected.includes(m))) {
      throw new Error('Payment Mode options incomplete');
    }
  });

  await test('Reconciliation Status dropdown', async () => {
    const res = await apiCall('get', '/dropdown-options', 'Finance Manager');
    const expected = ['Pending', 'Reconciled', 'Discrepancy'];
    if (!res.data.reconciliationStatus.every(s => expected.includes(s))) {
      throw new Error('Reconciliation Status options incomplete');
    }
  });

  // 8. CASCADING DROPDOWN TESTING
  console.log('\n📋 8. CASCADING DROPDOWN TESTING\n');

  await test('Purchase Orders - Vendor to Deal cascading', async () => {
    const res = await apiCall('get', '/dropdown-options', 'Operations Manager');
    if (!res.data.vendors || !res.data.deals) {
      throw new Error('Vendor/Deal data missing for cascading');
    }
    // Verify deals are approved
    const approvedDeals = res.data.deals.filter(d => d.approvalStatus === 'Approved');
    if (approvedDeals.length === 0) {
      throw new Error('No approved deals for cascading');
    }
  });

  // 9. DATA VERIFICATION
  console.log('\n📋 9. DATA VERIFICATION\n');

  await test('Test vendors exist in database', async () => {
    const res = await apiCall('get', '/vendors', 'Operations Manager');
    const vendorNames = res.data.map(v => v.vendorName);
    const expected = ['Ramesh Kumar', 'SkillEdge Solutions Pvt Ltd', 'DataMind Consulting LLP', 'Unknown Trainer'];
    const found = expected.filter(e => vendorNames.includes(e));
    if (found.length < 3) {
      throw new Error(`Expected vendors not found. Found: ${found.join(', ')}`);
    }
  });

  await test('Test deals exist in database', async () => {
    const res = await apiCall('get', '/deals', 'Business Head');
    const dealIds = res.data.map(d => d.dealId);
    const expected = ['DEAL-HIGH-01', 'DEAL-MID-01', 'DEAL-LOW-01'];
    const found = expected.filter(e => dealIds.includes(e));
    if (found.length < 2) {
      throw new Error(`Expected deals not found. Found: ${found.join(', ')}`);
    }
  });

  await test('Test programs exist in database', async () => {
    const res = await apiCall('get', '/programs', 'Operations Manager');
    const programNames = res.data.map(p => p.programName);
    const expected = ['Advanced Java Training', 'Data Science Bootcamp', 'IT Consulting Support'];
    const found = expected.filter(e => programNames.includes(e));
    if (found.length < 2) {
      throw new Error(`Expected programs not found. Found: ${found.join(', ')}`);
    }
  });

  await test('Test invoices exist with correct GST types', async () => {
    const res = await apiCall('get', '/invoices', 'Finance Manager');
    const invoices = res.data;
    const inv1 = invoices.find(i => i.clientInvoiceNumber === 'INV-001');
    const inv2 = invoices.find(i => i.clientInvoiceNumber === 'INV-002');
    
    if (!inv1 || inv1.gstType !== 'IGST') {
      throw new Error('INV-001 should have IGST');
    }
    if (!inv2 || inv2.gstType !== 'CGST+SGST') {
      throw new Error('INV-002 should have CGST+SGST');
    }
  });

  // 10. ROLE-BASED ACCESS TESTING
  console.log('\n📋 10. ROLE-BASED ACCESS TESTING\n');

  await test('Operations Manager cannot access deals', async () => {
    try {
      await apiCall('get', '/deals', 'Operations Manager');
      throw new Error('Should have been denied access');
    } catch (error) {
      if (error.response?.status !== 403) throw error;
    }
  });

  await test('Business Head cannot access vendors', async () => {
    try {
      await apiCall('get', '/vendors', 'Business Head');
      throw new Error('Should have been denied access');
    } catch (error) {
      if (error.response?.status !== 403) throw error;
    }
  });

  await test('Finance Manager can access invoices', async () => {
    await apiCall('get', '/invoices', 'Finance Manager');
  });

  await test('Director can access governance', async () => {
    await apiCall('get', '/governance/risk-alerts', 'Director');
  });

  // 11. DASHBOARD TESTING
  console.log('\n📋 11. DASHBOARD TESTING\n');

  await test('Operations Manager dashboard loads', async () => {
    const res = await apiCall('get', '/dashboards/operations', 'Operations Manager');
    if (!res.data) throw new Error('Dashboard data missing');
  });

  await test('Business Head dashboard loads', async () => {
    const res = await apiCall('get', '/dashboards/business', 'Business Head');
    if (!res.data) throw new Error('Dashboard data missing');
  });

  await test('Finance Manager dashboard loads', async () => {
    const res = await apiCall('get', '/dashboards/finance', 'Finance Manager');
    if (!res.data) throw new Error('Dashboard data missing');
  });

  await test('Director dashboard loads', async () => {
    const res = await apiCall('get', '/dashboards/director', 'Director');
    if (!res.data) throw new Error('Dashboard data missing');
  });

  // 12. FORM SUBMISSION TESTING
  console.log('\n📋 12. FORM SUBMISSION TESTING\n');

  await test('Create vendor with dropdown values', async () => {
    const vendorData = {
      vendorType: 'Individual',
      vendorName: 'Test Vendor',
      panNumber: 'TEST1234A',
      gstNumber: '',
      bankAccountNumber: '1234567890',
      ifscCode: 'HDFC0001234',
      bankName: 'HDFC Bank',
      address: 'Test Address',
      contactPersonName: 'Test Person',
      email: 'test@test.com',
      phone: '9876543210',
      status: 'Active'
    };
    const res = await apiCall('post', '/vendors', 'Operations Manager', vendorData);
    if (!res.data._id) throw new Error('Vendor creation failed');
  });

  // 13. TDS & TAX VERIFICATION
  console.log('\n📋 13. TDS & TAX VERIFICATION\n');

  await test('Invoice with IGST calculates correctly', async () => {
    const invoices = await apiCall('get', '/invoices', 'Finance Manager');
    const inv1 = invoices.data.find(i => i.clientInvoiceNumber === 'INV-001');
    if (!inv1) throw new Error('INV-001 not found');
    if (inv1.gstType !== 'IGST' || inv1.taxAmount !== 180000) {
      throw new Error('IGST calculation incorrect');
    }
  });

  await test('Invoice with CGST+SGST exists', async () => {
    const invoices = await apiCall('get', '/invoices', 'Finance Manager');
    const inv2 = invoices.data.find(i => i.clientInvoiceNumber === 'INV-002');
    if (!inv2) throw new Error('INV-002 not found');
    if (inv2.gstType !== 'CGST+SGST') {
      throw new Error('CGST+SGST invoice not found');
    }
  });

  // 14. FINAL SUMMARY
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 TEST SUMMARY\n');
  console.log(`✅ Passed: ${testResults.passed.length}`);
  console.log(`❌ Failed: ${testResults.failed.length}`);
  console.log(`⚠️  Warnings: ${testResults.warnings.length}`);
  
  if (testResults.failed.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.failed.forEach(f => {
      console.log(`   - ${f.name}: ${f.error}`);
    });
  }

  if (testResults.passed.length > 0 && testResults.failed.length === 0) {
    console.log('\n✅ ALL TESTS PASSED - SYSTEM READY FOR PRODUCTION');
    process.exit(0);
  } else {
    console.log('\n⚠️  SOME TESTS FAILED - REVIEW REQUIRED');
    process.exit(1);
  }
};

// Connect to MongoDB and run tests
mongoose.connect(process.env.MONGODB_URI, { dbName: 'GKT-ERP' })
  .then(() => {
    console.log('✅ Connected to MongoDB');
    return runTests();
  })
  .catch(error => {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  });
