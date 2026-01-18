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
    const errorMsg = error.response?.data?.error || error.message || String(error);
    testResults.failed.push({ name, error: errorMsg });
    log(`FAIL: ${name} - ${errorMsg}`, 'error');
    if (error.response) {
      console.log(`   Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
};

const login = async (role, subRole = null) => {
  const testUsers = {
    'Operations Manager': { email: 'operations@singleplayground.com', password: 'Operations@2026' },
    'Business Head': { email: 'business@singleplayground.com', password: 'Business@2026' },
    'Finance Manager': { email: 'finance@singleplayground.com', password: 'Finance@2026' },
    'Director': { email: 'director@singleplayground.com', password: 'Director@2026' },
    'SalesExecutive': { email: 'sales.exec@singleplayground.com', password: 'Sales@2026' },
    'SalesManager': { email: 'sales.mgr@singleplayground.com', password: 'SalesMgr@2026' }
  };
  
  let user;
  if (role === 'Business Head' && subRole) {
    // For sub-roles, use the sub-role user credentials but login as Business Head
    user = testUsers[subRole];
  } else {
    user = testUsers[role];
  }
  
  if (!user) {
    throw new Error(`No test user found for role: ${role}, subRole: ${subRole}`);
  }
  
  const response = await axios.post(`${API_BASE}/auth/login`, {
    email: user.email,
    password: user.password,
    role: role,
    subRole: subRole
  });
  
  const key = subRole ? `Business Head_${subRole}` : role;
  authTokens[key] = response.data.token;
  return { token: response.data.token, user: response.data.user };
};

const apiCall = async (method, endpoint, roleKey, data = null) => {
  let token = authTokens[roleKey];
  if (!token) {
    // Parse roleKey to extract role and subRole
    if (roleKey.includes('_')) {
      const parts = roleKey.split('_');
      const role = 'Business Head';
      const subRole = parts[1];
      const result = await login(role, subRole);
      token = result.token;
      authTokens[roleKey] = token;
    } else {
      const result = await login(roleKey);
      token = result.token;
      authTokens[roleKey] = token;
    }
  }
  const config = {
    method,
    url: `${API_BASE}${endpoint}`,
    headers: { Authorization: `Bearer ${token}` }
  };
  if (data) config.data = data;
  try {
    return await axios(config);
  } catch (error) {
    // Re-throw with more context
    if (error.response) {
      error.message = `${error.message} (Status: ${error.response.status})`;
    }
    throw error;
  }
};

const runRoleSubRoleTests = async () => {
  console.log('\n🚀 ROLE + SUB-ROLE COMPREHENSIVE TEST SUITE\n');
  console.log('='.repeat(70));

  // ============================================
  // PHASE 1: AUTHENTICATION & ROLE ISOLATION
  // ============================================
  console.log('\n📋 PHASE 1: AUTHENTICATION & ROLE ISOLATION\n');

  let salesExecUser, salesMgrUser, businessHeadUser;

  await test('Login as Business Head (no subRole)', async () => {
    const result = await login('Business Head', null);
    businessHeadUser = result.user;
    if (result.user.role !== 'Business Head') throw new Error('Wrong role');
    if (result.user.subRole !== null) throw new Error('Should have no subRole');
  });

  await test('Login as Business Head + SalesExecutive subRole', async () => {
    const result = await login('Business Head', 'SalesExecutive');
    salesExecUser = result.user;
    if (result.user.role !== 'Business Head') throw new Error('Wrong role');
    if (result.user.subRole !== 'SalesExecutive') throw new Error('Wrong subRole');
  });

  await test('Login as Business Head + SalesManager subRole', async () => {
    const result = await login('Business Head', 'SalesManager');
    salesMgrUser = result.user;
    if (result.user.role !== 'Business Head') throw new Error('Wrong role');
    if (result.user.subRole !== 'SalesManager') throw new Error('Wrong subRole');
  });

  await test('SalesExecutive cannot access Finance routes', async () => {
    try {
      await apiCall('get', '/invoices', 'Business Head_SalesExecutive');
      throw new Error('Should have been blocked');
    } catch (error) {
      if (error.response?.status === 403) {
        return; // Expected
      }
      throw error;
    }
  });

  await test('SalesManager cannot access Finance routes', async () => {
    try {
      await apiCall('get', '/invoices', 'Business Head_SalesManager');
      throw new Error('Should have been blocked');
    } catch (error) {
      if (error.response?.status === 403) {
        return; // Expected
      }
      throw error;
    }
  });

  await test('SalesExecutive cannot access Operations routes', async () => {
    try {
      await apiCall('get', '/programs', 'Business Head_SalesExecutive');
      throw new Error('Should have been blocked');
    } catch (error) {
      if (error.response?.status === 403) {
        return; // Expected
      }
      throw error;
    }
  });

  // ============================================
  // PHASE 2: SALES OPPORTUNITY FLOW
  // ============================================
  console.log('\n📋 PHASE 2: SALES OPPORTUNITY FLOW (SUB-ROLE AWARE)\n');

  let opportunityId;

  await test('SalesExecutive can create opportunity', async () => {
    const opp = await apiCall('post', '/opportunities', 'Business Head_SalesExecutive', {
      clientCompanyName: 'Infosys Limited',
      clientContactName: 'John Doe',
      clientEmail: 'john@infosys.com',
      clientPhone: '9876543210',
      designation: 'Manager',
      location: 'Karnataka',
      opportunityType: 'Training',
      serviceCategory: 'Corporate',
      expectedParticipants: 30,
      expectedDuration: 5,
      expectedStartDate: '2026-02-15',
      expectedCommercialValue: 1000000
    });
    opportunityId = opp.data._id;
    if (!opp.data.opportunityId) throw new Error('Adhoc ID not generated');
  });

  await test('SalesExecutive can only see own opportunities', async () => {
    const opps = await apiCall('get', '/opportunities', 'Business Head_SalesExecutive');
    const allOwn = opps.data.every(o => o.salesExecutiveId?.toString() === salesExecUser.id);
    if (!allOwn && opps.data.length > 0) throw new Error('SalesExecutive sees other opportunities');
  });

  await test('SalesExecutive cannot approve opportunity', async () => {
    try {
      await apiCall('put', `/opportunities/${opportunityId}`, 'Business Head_SalesExecutive', {
        opportunityStatus: 'Qualified'
      });
      throw new Error('Should have been blocked');
    } catch (error) {
      if (error.response?.status === 403) {
        return; // Expected
      }
      // If status change is blocked by business logic, that's also acceptable
      if (error.response?.status === 400 && error.response.data?.error?.includes('Only Sales Manager')) {
        return; // Expected
      }
      throw error;
    }
  });

  await test('SalesManager can see all opportunities', async () => {
    const opps = await apiCall('get', '/opportunities', 'Business Head_SalesManager');
    if (opps.data.length === 0) throw new Error('No opportunities found');
  });

  await test('SalesManager can qualify opportunity', async () => {
    await apiCall('put', `/opportunities/${opportunityId}`, 'Business Head_SalesManager', {
      opportunityStatus: 'Qualified'
    });
  });

  await test('SalesManager can send opportunity to delivery', async () => {
    await apiCall('put', `/opportunities/${opportunityId}/send-to-delivery`, 'Business Head_SalesManager');
  });

  await test('Business Head (no subRole) can view all opportunities', async () => {
    const opps = await apiCall('get', '/opportunities', 'Business Head');
    if (opps.data.length === 0) throw new Error('No opportunities found');
  });

  // ============================================
  // PHASE 3: OPPORTUNITY → DELIVERY HANDOFF
  // ============================================
  console.log('\n📋 PHASE 3: OPPORTUNITY → DELIVERY HANDOFF\n');

  await test('Operations Manager can see opportunities sent to delivery', async () => {
    const opps = await apiCall('get', '/opportunities/for-delivery', 'Operations Manager');
    if (opps.data.length === 0) throw new Error('No opportunities sent to delivery');
  });

  let dealId;

  await test('Operations Manager can create Deal from Opportunity', async () => {
    // First get a vendor for the deal
    const vendors = await apiCall('get', '/vendors', 'Operations Manager');
    const vendorId = vendors.data[0]?._id;
    
    const deal = await apiCall('post', '/deals', 'Operations Manager', {
      opportunityId: opportunityId,
      clientName: 'Infosys Limited',
      dealType: 'Training',
      revenueCategory: 'Corporate',
      totalOrderValue: 1000000,
      totalCost: 500000,
      vendorProposalUpload: 'https://example.com/proposal.pdf',
      costBreakdown: vendorId ? [{
        vendorId: vendorId,
        costType: 'Trainer',
        amount: 250000,
        notes: 'Training cost'
      }] : []
    });
    dealId = deal.data._id;
    if (!deal.data.dealId) throw new Error('Deal ID not generated');
  });

  await test('Opportunity status updated to Converted to Deal', async () => {
    const opp = await apiCall('get', `/opportunities/${opportunityId}`, 'Business Head');
    if (opp.data.opportunityStatus !== 'Converted to Deal') {
      throw new Error('Opportunity status not updated');
    }
  });

  // ============================================
  // PHASE 4: DELIVERY & COSTING FLOW
  // ============================================
  console.log('\n📋 PHASE 4: DELIVERY & COSTING FLOW\n');

  await test('GP auto-calculation works', async () => {
    const deal = await apiCall('get', `/deals/${dealId}`, 'Operations Manager');
    const gp = ((deal.data.totalOrderValue - deal.data.totalCost) / deal.data.totalOrderValue) * 100;
    if (Math.abs(gp - deal.data.grossMargin) > 0.01) {
      throw new Error('GP calculation mismatch');
    }
  });

  // ============================================
  // PHASE 5: FINANCE FLOW
  // ============================================
  console.log('\n📋 PHASE 5: FINANCE FLOW (GST + TDS)\n');

  await test('Finance Manager can generate invoice', async () => {
    const invoice = await apiCall('post', '/invoices', 'Finance Manager', {
      dealId: dealId,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    if (!invoice.data.invoiceNumber) throw new Error('Invoice not generated');
  });

  await test('Finance Manager cannot edit opportunity', async () => {
    try {
      await apiCall('put', `/opportunities/${opportunityId}`, 'Finance Manager');
      throw new Error('Should have been blocked');
    } catch (error) {
      if (error.response?.status === 403) {
        return; // Expected
      }
      throw error;
    }
  });

  // ============================================
  // PHASE 6: DIRECTOR GOVERNANCE
  // ============================================
  console.log('\n📋 PHASE 6: DIRECTOR GOVERNANCE\n');

  await test('Director can view all opportunities (read-only)', async () => {
    const opps = await apiCall('get', '/opportunities', 'Director');
    if (opps.data.length === 0) throw new Error('No opportunities found');
  });

  await test('Director can view audit trail', async () => {
    const audits = await apiCall('get', '/governance/audit-trail', 'Director');
    if (!Array.isArray(audits.data)) throw new Error('Audit trail not accessible');
  });

  // ============================================
  // PHASE 7: DROPDOWN VALIDATION
  // ============================================
  console.log('\n📋 PHASE 7: DROPDOWN & FIELD VALIDATION\n');

  await test('SalesExecutive dropdown options loaded', async () => {
    const options = await apiCall('get', '/dropdown-options', 'Business Head_SalesExecutive');
    if (!options.data.opportunityType) throw new Error('Opportunity type dropdown missing');
    if (!options.data.serviceCategory) throw new Error('Service category dropdown missing');
  });

  await test('SalesManager dropdown options loaded', async () => {
    const options = await apiCall('get', '/dropdown-options', 'Business Head_SalesManager');
    if (!options.data.opportunityType) throw new Error('Opportunity type dropdown missing');
  });

  // ============================================
  // FINAL SUMMARY
  // ============================================
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 TEST SUMMARY\n');
  console.log(`✅ Passed: ${testResults.passed.length}`);
  console.log(`❌ Failed: ${testResults.failed.length}`);
  console.log(`⚠️  Warnings: ${testResults.warnings.length}`);

  if (testResults.failed.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.failed.forEach(f => {
      console.log(`  - ${f.name}: ${f.error}`);
    });
  }

  if (testResults.failed.length === 0) {
    console.log('\n✅ ALL TESTS PASSED - SYSTEM IS PRODUCTION READY\n');
    process.exit(0);
  } else {
    console.log('\n❌ SOME TESTS FAILED - SYSTEM NOT READY\n');
    process.exit(1);
  }
};

// Run tests
mongoose.connect(process.env.MONGODB_URI, { dbName: 'GKT-ERP' })
  .then(() => {
    console.log('Connected to MongoDB');
    return runRoleSubRoleTests();
  })
  .catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  })
  .finally(() => {
    mongoose.connection.close();
  });
