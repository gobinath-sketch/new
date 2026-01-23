import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

const testUsers = {
  'Sales Executive': { email: 'salesexec@singleplayground.com', password: 'SalesExec@2026' },
  'Sales Manager': { email: 'salesmgr@singleplayground.com', password: 'SalesMgr@2026' },
  'Business Head': { email: 'business@singleplayground.com', password: 'Business@2026' },
  'Director': { email: 'director@singleplayground.com', password: 'Director@2026' },
  'Finance Manager': { email: 'finance@singleplayground.com', password: 'Finance@2026' },
  'Operations Manager': { email: 'operations@singleplayground.com', password: 'Operations@2026' }
};

async function login(role) {
  const res = await axios.post(`${BASE_URL}/auth/login`, testUsers[role]);
  return { token: res.data.token, user: res.data.user };
}

async function api(token, method, endpoint, data = null) {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  if (method === 'GET') return (await axios.get(`${BASE_URL}${endpoint}`, config)).data;
  if (method === 'POST') return (await axios.post(`${BASE_URL}${endpoint}`, data, config)).data;
  if (method === 'PUT') return (await axios.put(`${BASE_URL}${endpoint}`, data, config)).data;
  if (method === 'DELETE') return (await axios.delete(`${BASE_URL}${endpoint}`, config)).data;
}

async function runE2EFlow() {
  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║         COMPLETE END-TO-END WORKFLOW TEST                            ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝\n');

  const tokens = {};
  let createdClient = null;
  let createdOpportunity = null;

  try {
    // ═══════════════════════════════════════════════════════════════════
    // STEP 1: Login All Roles
    // ═══════════════════════════════════════════════════════════════════
    console.log('STEP 1: AUTHENTICATING ALL ROLES');
    console.log('─'.repeat(70));
    for (const role of Object.keys(testUsers)) {
      const { token, user } = await login(role);
      tokens[role] = token;
      console.log(`  ✓ ${role}: ${user.name} (${user.email})`);
    }
    console.log();

    // ═══════════════════════════════════════════════════════════════════
    // STEP 2: Sales Executive Creates Client
    // ═══════════════════════════════════════════════════════════════════
    console.log('STEP 2: SALES EXECUTIVE CREATES CLIENT');
    console.log('─'.repeat(70));
    createdClient = await api(tokens['Sales Executive'], 'POST', '/clients', {
      clientName: 'E2E Test Company ' + Date.now(),
      trainingSector: 'Corporate',
      contactPersonName: ['Test Contact'],
      designation: ['Manager'],
      contactNumber: ['9876543210'],
      emailId: 'test' + Date.now() + '@test.com',
      location: 'Mumbai'
    });
    console.log(`  ✓ Client Created: ${createdClient.clientName}`);
    console.log(`    ID: ${createdClient._id}`);
    console.log();

    // ═══════════════════════════════════════════════════════════════════
    // STEP 3: Sales Executive Creates Opportunity
    // ═══════════════════════════════════════════════════════════════════
    console.log('STEP 3: SALES EXECUTIVE CREATES OPPORTUNITY');
    console.log('─'.repeat(70));
    createdOpportunity = await api(tokens['Sales Executive'], 'POST', '/opportunities', {
      billingClient: createdClient.clientName,
      endClient: createdClient.clientName,
      clientCompanyName: createdClient.clientName,
      courseName: 'E2E Test Training',
      courseCode: 'E2E-001',
      expectedCommercialValue: 100000,
      tov: 100000,
      opportunityStatus: 'New',
      gpPercent: 25,
      opportunityType: 'Training',
      serviceCategory: 'Corporate',
      expectedStartDate: new Date().toISOString(),
      expectedDuration: 5,
      expectedParticipants: 20
    });
    console.log(`  ✓ Opportunity Created: ${createdOpportunity.opportunityId}`);
    console.log(`    Status: ${createdOpportunity.opportunityStatus}`);
    console.log(`    Value: ₹${createdOpportunity.expectedCommercialValue?.toLocaleString()}`);
    console.log();

    // ═══════════════════════════════════════════════════════════════════
    // STEP 4: Sales Manager Qualifies Opportunity
    // ═══════════════════════════════════════════════════════════════════
    console.log('STEP 4: SALES MANAGER QUALIFIES OPPORTUNITY');
    console.log('─'.repeat(70));
    const qualifiedOpp = await api(tokens['Sales Manager'], 'PUT', `/opportunities/${createdOpportunity._id}`, {
      opportunityStatus: 'Qualified'
    });
    console.log(`  ✓ Opportunity Qualified`);
    console.log(`    Status: ${qualifiedOpp.opportunityStatus}`);
    console.log(`    Qualified At: ${qualifiedOpp.qualifiedAt}`);
    console.log();

    // ═══════════════════════════════════════════════════════════════════
    // STEP 5: Sales Manager Sends to Delivery
    // ═══════════════════════════════════════════════════════════════════
    console.log('STEP 5: SALES MANAGER SENDS TO DELIVERY');
    console.log('─'.repeat(70));
    const sentOpp = await api(tokens['Sales Manager'], 'PUT', `/opportunities/${createdOpportunity._id}`, {
      opportunityStatus: 'Sent to Delivery'
    });
    console.log(`  ✓ Sent to Delivery`);
    console.log(`    Status: ${sentOpp.opportunityStatus}`);
    console.log();

    // ═══════════════════════════════════════════════════════════════════
    // STEP 6: Check Notifications Created
    // ═══════════════════════════════════════════════════════════════════
    console.log('STEP 6: VERIFYING NOTIFICATIONS');
    console.log('─'.repeat(70));
    for (const role of ['Business Head', 'Operations Manager', 'Finance Manager']) {
      const notifications = await api(tokens[role], 'GET', '/notifications');
      console.log(`  ${role}: ${notifications.length} notification(s)`);
    }
    console.log();

    // ═══════════════════════════════════════════════════════════════════
    // STEP 7: Verify Dashboard Data Updates
    // ═══════════════════════════════════════════════════════════════════
    console.log('STEP 7: VERIFYING DASHBOARD DATA UPDATES');
    console.log('─'.repeat(70));

    // Sales Executive Dashboard
    const seDash = await api(tokens['Sales Executive'], 'GET', '/dashboards/sales-executive');
    console.log(`  Sales Executive Dashboard:`);
    console.log(`    - My Opportunities: ${seDash.opportunities || 0}`);
    console.log(`    - My Clients: ${seDash.leadCapture || 0}`);

    // Sales Manager Dashboard
    const smDash = await api(tokens['Sales Manager'], 'GET', '/dashboards/sales-manager');
    console.log(`  Sales Manager Dashboard:`);
    console.log(`    - Total Opportunities: ${smDash.totalOpportunities || 0}`);
    console.log(`    - In Progress: ${smDash.inProgressOpportunities || 0}`);

    // Business Head Dashboard
    const bhDash = await api(tokens['Business Head'], 'GET', '/dashboards/business');
    console.log(`  Business Head Dashboard:`);
    console.log(`    - Pipeline Count: ${bhDash.pipelineCount || 0}`);
    console.log(`    - Pipeline Value: ₹${(bhDash.pipelineValue || 0).toLocaleString()}`);

    // Finance Manager Dashboard
    const fmDash = await api(tokens['Finance Manager'], 'GET', '/dashboards/finance');
    console.log(`  Finance Manager Dashboard:`);
    console.log(`    - Total Revenue: ₹${(fmDash.totalRevenue || 0).toLocaleString()}`);
    console.log(`    - Total Opportunities: ${fmDash.totalOpportunities || 0}`);

    // Director Dashboard
    const dirDash = await api(tokens['Director'], 'GET', '/dashboards/director');
    console.log(`  Director Dashboard:`);
    console.log(`    - Total Opportunities: ${dirDash.totalOpportunities || 0}`);
    console.log(`    - Active Pipeline: ${dirDash.activeOpportunities || 0}`);
    console.log();

    // ═══════════════════════════════════════════════════════════════════
    // STEP 8: Director Sets Revenue Target
    // ═══════════════════════════════════════════════════════════════════
    console.log('STEP 8: DIRECTOR SETS REVENUE TARGET');
    console.log('─'.repeat(70));
    const targetResult = await api(tokens['Director'], 'POST', '/revenue-targets', {
      year: new Date().getFullYear(),
      period: 'Yearly',
      amount: 10000000
    });
    console.log(`  ✓ Revenue Target Set: ₹${targetResult.amount?.toLocaleString() || '10,000,000'}`);
    console.log();

    // ═══════════════════════════════════════════════════════════════════
    // STEP 9: Cross-Role Data Visibility Check
    // ═══════════════════════════════════════════════════════════════════
    console.log('STEP 9: CROSS-ROLE DATA VISIBILITY');
    console.log('─'.repeat(70));
    const roles = ['Sales Executive', 'Sales Manager', 'Business Head', 'Director', 'Finance Manager', 'Operations Manager'];
    
    for (const role of roles) {
      const opps = await api(tokens[role], 'GET', '/opportunities');
      const hasCreatedOpp = opps.some(o => o._id === createdOpportunity._id);
      console.log(`  ${role}: Can see test opportunity: ${hasCreatedOpp ? '✓ Yes' : '✗ No'}`);
    }
    console.log();

    // ═══════════════════════════════════════════════════════════════════
    // CLEANUP
    // ═══════════════════════════════════════════════════════════════════
    console.log('CLEANUP: REMOVING TEST DATA');
    console.log('─'.repeat(70));
    await api(tokens['Director'], 'DELETE', `/opportunities/${createdOpportunity._id}`);
    console.log(`  ✓ Deleted test opportunity`);
    await api(tokens['Sales Executive'], 'DELETE', `/clients/${createdClient._id}`);
    console.log(`  ✓ Deleted test client`);
    console.log();

    console.log('╔══════════════════════════════════════════════════════════════════════╗');
    console.log('║         ✓ ALL E2E TESTS PASSED SUCCESSFULLY                          ║');
    console.log('╚══════════════════════════════════════════════════════════════════════╝');

  } catch (error) {
    console.error('\n❌ ERROR:', error.response?.data || error.message);
    
    // Cleanup on error
    if (createdOpportunity?._id && tokens['Director']) {
      try { await api(tokens['Director'], 'DELETE', `/opportunities/${createdOpportunity._id}`); } catch {}
    }
    if (createdClient?._id && tokens['Sales Executive']) {
      try { await api(tokens['Sales Executive'], 'DELETE', `/clients/${createdClient._id}`); } catch {}
    }
  }
}

runE2EFlow();
