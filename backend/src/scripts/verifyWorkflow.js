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
  const creds = testUsers[role];
  try {
    const res = await axios.post(`${BASE_URL}/auth/login`, creds);
    return res.data.token;
  } catch (e) {
    console.error(`  ✗ Login failed for ${role}:`, e.response?.data?.error || e.message);
    return null;
  }
}

async function testEndpoint(token, method, endpoint, data = null) {
  try {
    const config = { headers: { Authorization: `Bearer ${token}` } };
    let res;
    if (method === 'GET') res = await axios.get(`${BASE_URL}${endpoint}`, config);
    else if (method === 'POST') res = await axios.post(`${BASE_URL}${endpoint}`, data, config);
    else if (method === 'PUT') res = await axios.put(`${BASE_URL}${endpoint}`, data, config);
    return { success: true, data: res.data };
  } catch (e) {
    return { success: false, error: e.response?.data?.error || e.message };
  }
}

async function verifyWorkflow() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║       COMPLETE WORKFLOW VERIFICATION                          ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const tokens = {};
  
  // Step 1: Login all roles
  console.log('1. AUTHENTICATING ALL ROLES');
  console.log('─'.repeat(50));
  for (const role of Object.keys(testUsers)) {
    const token = await login(role);
    if (token) {
      tokens[role] = token;
      console.log(`  ✓ ${role} authenticated`);
    }
  }
  console.log();

  // Step 2: Verify Dashboard Access
  console.log('2. VERIFYING DASHBOARD ACCESS');
  console.log('─'.repeat(50));
  const dashboardEndpoints = {
    'Sales Executive': '/dashboards/sales-executive',
    'Sales Manager': '/dashboards/sales-manager',
    'Business Head': '/dashboards/business',
    'Director': '/dashboards/director',
    'Finance Manager': '/dashboards/finance',
    'Operations Manager': '/dashboards/operations'
  };

  for (const [role, endpoint] of Object.entries(dashboardEndpoints)) {
    if (!tokens[role]) continue;
    const result = await testEndpoint(tokens[role], 'GET', endpoint);
    if (result.success) {
      console.log(`  ✓ ${role} dashboard working`);
    } else {
      console.log(`  ✗ ${role} dashboard FAILED: ${result.error}`);
    }
  }
  console.log();

  // Step 3: Verify Cross-Role Data Access
  console.log('3. VERIFYING CROSS-ROLE DATA ACCESS');
  console.log('─'.repeat(50));
  
  const dataEndpoints = [
    { endpoint: '/opportunities', roles: ['Sales Executive', 'Sales Manager', 'Business Head', 'Director', 'Finance Manager', 'Operations Manager'] },
    { endpoint: '/deals', roles: ['Sales Executive', 'Sales Manager', 'Business Head', 'Director', 'Finance Manager', 'Operations Manager'] },
    { endpoint: '/clients', roles: ['Sales Executive', 'Sales Manager', 'Business Head', 'Director', 'Finance Manager', 'Operations Manager'] },
    { endpoint: '/programs', roles: ['Operations Manager', 'Finance Manager', 'Director', 'Business Head'] },
    { endpoint: '/invoices', roles: ['Finance Manager', 'Director', 'Sales Executive', 'Sales Manager', 'Business Head'] },
    { endpoint: '/receivables', roles: ['Finance Manager', 'Director'] },
    { endpoint: '/payables', roles: ['Finance Manager', 'Director'] },
    { endpoint: '/vendors', roles: ['Operations Manager', 'Finance Manager', 'Director'] }
  ];

  for (const { endpoint, roles } of dataEndpoints) {
    console.log(`  ${endpoint}:`);
    for (const role of roles) {
      if (!tokens[role]) continue;
      const result = await testEndpoint(tokens[role], 'GET', endpoint);
      if (result.success) {
        const count = Array.isArray(result.data) ? result.data.length : 'N/A';
        console.log(`    ✓ ${role}: ${count} records`);
      } else {
        console.log(`    ✗ ${role}: ${result.error}`);
      }
    }
  }
  console.log();

  // Step 4: Verify Finance Manager Analytics
  console.log('4. VERIFYING FINANCE ANALYTICS ENDPOINTS');
  console.log('─'.repeat(50));
  if (tokens['Finance Manager']) {
    const financeEndpoints = [
      '/dashboards/finance/client-gp',
      '/dashboards/finance/vendor-expenses'
    ];
    for (const ep of financeEndpoints) {
      const result = await testEndpoint(tokens['Finance Manager'], 'GET', ep);
      if (result.success) {
        console.log(`  ✓ ${ep}: OK`);
      } else {
        console.log(`  ✗ ${ep}: ${result.error}`);
      }
    }
  }
  console.log();

  // Step 5: Verify Sales Manager Team Endpoints
  console.log('5. VERIFYING SALES MANAGER TEAM ENDPOINTS');
  console.log('─'.repeat(50));
  if (tokens['Sales Manager']) {
    const smEndpoints = [
      '/dashboards/sales-manager/team-members',
      '/dashboards/sales-manager/monthly-performance'
    ];
    for (const ep of smEndpoints) {
      const result = await testEndpoint(tokens['Sales Manager'], 'GET', ep);
      if (result.success) {
        console.log(`  ✓ ${ep}: OK`);
      } else {
        console.log(`  ✗ ${ep}: ${result.error}`);
      }
    }
  }
  console.log();

  // Step 6: Verify Notifications
  console.log('6. VERIFYING NOTIFICATION SYSTEM');
  console.log('─'.repeat(50));
  for (const role of Object.keys(tokens)) {
    const result = await testEndpoint(tokens[role], 'GET', '/notifications');
    if (result.success) {
      const count = Array.isArray(result.data) ? result.data.length : 0;
      console.log(`  ✓ ${role}: ${count} notifications`);
    } else {
      console.log(`  ✗ ${role}: ${result.error}`);
    }
  }
  console.log();

  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║       VERIFICATION COMPLETE                                   ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
}

verifyWorkflow().catch(console.error);
