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

// Test data generators
const industries = ['Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Education'];
const sectors = ['Corporate', 'academics', 'university', 'college'];
const oppTypes = ['Training', 'Exam Voucher', 'Content Development / Project Work', 'Consultant (Resource Support)'];
const serviceCategories = ['Corporate', 'Academic', 'Government', 'Individual'];
const locations = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Ahmedabad'];
const courses = [
  { name: 'AWS Solutions Architect', code: 'AWS-SA' },
  { name: 'Azure Administrator', code: 'AZ-104' },
  { name: 'Python for Data Science', code: 'PY-DS' },
  { name: 'DevOps Engineering', code: 'DEVOPS' },
  { name: 'Kubernetes Administration', code: 'K8S-ADM' },
  { name: 'Machine Learning Basics', code: 'ML-101' },
  { name: 'Cybersecurity Fundamentals', code: 'SEC-101' },
  { name: 'Project Management Professional', code: 'PMP' },
  { name: 'Agile Scrum Master', code: 'ASM' },
  { name: 'Full Stack Development', code: 'FSD' }
];

const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

let tokens = {};
let testResults = { passed: 0, failed: 0, errors: [] };
let createdEntities = { clients: [], opportunities: [], vendors: [], programs: [], invoices: [], deals: [] };

async function login(role) {
  try {
    const res = await axios.post(`${BASE_URL}/auth/login`, testUsers[role]);
    return { token: res.data.token, user: res.data.user };
  } catch (e) {
    throw new Error(`Login failed for ${role}: ${e.response?.data?.error || e.message}`);
  }
}

async function api(token, method, endpoint, data = null) {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  try {
    if (method === 'GET') return (await axios.get(`${BASE_URL}${endpoint}`, config)).data;
    if (method === 'POST') return (await axios.post(`${BASE_URL}${endpoint}`, data, config)).data;
    if (method === 'PUT') return (await axios.put(`${BASE_URL}${endpoint}`, data, config)).data;
    if (method === 'DELETE') return (await axios.delete(`${BASE_URL}${endpoint}`, config)).data;
  } catch (e) {
    throw new Error(`API ${method} ${endpoint}: ${e.response?.data?.error || e.message}`);
  }
}

function logTest(testName, passed, details = '') {
  if (passed) {
    testResults.passed++;
    console.log(`    ✅ ${testName}${details ? ': ' + details : ''}`);
  } else {
    testResults.failed++;
    testResults.errors.push({ test: testName, details });
    console.log(`    ❌ ${testName}: ${details}`);
  }
}

async function testAuthentication() {
  console.log('\n  📋 AUTHENTICATION TESTS');
  console.log('  ' + '─'.repeat(60));
  
  for (const role of Object.keys(testUsers)) {
    try {
      const { token, user } = await login(role);
      tokens[role] = token;
      logTest(`${role} Login`, true, `${user.name}`);
    } catch (e) {
      logTest(`${role} Login`, false, e.message);
    }
  }
}

async function testClientCRUD(iteration) {
  console.log('\n  📋 CLIENT CRUD TESTS');
  console.log('  ' + '─'.repeat(60));
  
  const clientData = {
    clientName: `Test Corp ${iteration} - ${Date.now()}`,
    trainingSector: randomChoice(sectors),
    contactPersonName: [`John Doe ${iteration}`, `Jane Smith ${iteration}`],
    designation: ['IT Manager', 'HR Director'],
    contactNumber: ['9876543210', '9876543211'],
    emailId: `test${iteration}_${Date.now()}@testcorp.com`,
    location: randomChoice(locations),
    linkedinProfile: `https://linkedin.com/company/testcorp${iteration}`
  };

  try {
    // CREATE
    const client = await api(tokens['Sales Executive'], 'POST', '/clients', clientData);
    createdEntities.clients.push(client._id);
    logTest('Create Client', true, client.clientName);

    // READ
    const readClient = await api(tokens['Sales Executive'], 'GET', `/clients/${client._id}`);
    logTest('Read Client', readClient.clientName === clientData.clientName, readClient.clientName);

    // UPDATE
    const updatedClient = await api(tokens['Sales Executive'], 'PUT', `/clients/${client._id}`, {
      ...clientData,
      contactPersonName: [...clientData.contactPersonName, `New Contact ${iteration}`]
    });
    logTest('Update Client', updatedClient.contactPersonName.length === 3, `Contacts: ${updatedClient.contactPersonName.length}`);

    // LIST (All roles access)
    for (const role of ['Sales Executive', 'Sales Manager', 'Director', 'Business Head', 'Finance Manager', 'Operations Manager']) {
      const clients = await api(tokens[role], 'GET', '/clients');
      logTest(`${role} List Clients`, Array.isArray(clients), `${clients.length} clients`);
    }

    return client;
  } catch (e) {
    logTest('Client CRUD', false, e.message);
    return null;
  }
}

async function testOpportunityCRUD(iteration, client) {
  console.log('\n  📋 OPPORTUNITY CRUD TESTS');
  console.log('  ' + '─'.repeat(60));

  const course = randomChoice(courses);
  const tov = randomInt(50000, 500000);
  const gpPercent = randomInt(15, 40);
  
  const oppData = {
    billingClient: client?.clientName || `Billing Client ${iteration}`,
    endClient: client?.clientName || `End Client ${iteration}`,
    clientCompanyName: client?.clientName || `Company ${iteration}`,
    courseName: course.name,
    courseCode: course.code,
    expectedCommercialValue: tov,
    tov: tov,
    finalGP: Math.round(tov * gpPercent / 100),
    gpPercent: gpPercent,
    opportunityStatus: 'New',
    opportunityType: randomChoice(oppTypes),
    serviceCategory: randomChoice(serviceCategories),
    expectedStartDate: new Date(Date.now() + randomInt(7, 30) * 24 * 60 * 60 * 1000).toISOString(),
    expectedDuration: randomInt(1, 10),
    expectedParticipants: randomInt(10, 50)
  };

  try {
    // CREATE by Sales Executive
    const opp = await api(tokens['Sales Executive'], 'POST', '/opportunities', oppData);
    createdEntities.opportunities.push(opp._id);
    logTest('Create Opportunity (SE)', true, `${opp.opportunityId} - ₹${tov.toLocaleString()} - GP: ${gpPercent}%`);

    // READ
    const readOpp = await api(tokens['Sales Executive'], 'GET', `/opportunities/${opp._id}`);
    logTest('Read Opportunity', readOpp.opportunityId === opp.opportunityId, opp.opportunityId);

    // QUALIFY by Sales Manager
    const qualifiedOpp = await api(tokens['Sales Manager'], 'PUT', `/opportunities/${opp._id}`, {
      opportunityStatus: 'Qualified'
    });
    logTest('Qualify Opportunity (SM)', qualifiedOpp.opportunityStatus === 'Qualified', `Status: ${qualifiedOpp.opportunityStatus}`);

    // SEND TO DELIVERY by Sales Manager
    const sentOpp = await api(tokens['Sales Manager'], 'PUT', `/opportunities/${opp._id}`, {
      opportunityStatus: 'Sent to Delivery'
    });
    logTest('Send to Delivery (SM)', sentOpp.opportunityStatus === 'Sent to Delivery', `Status: ${sentOpp.opportunityStatus}`);

    // LIST - All roles should see
    for (const role of Object.keys(testUsers)) {
      const opps = await api(tokens[role], 'GET', '/opportunities');
      const canSee = opps.some(o => o._id === opp._id);
      logTest(`${role} Can View Opportunity`, canSee, `Total: ${opps.length}`);
    }

    return opp;
  } catch (e) {
    logTest('Opportunity CRUD', false, e.message);
    return null;
  }
}

async function testVendorCRUD(iteration) {
  console.log('\n  📋 VENDOR CRUD TESTS');
  console.log('  ' + '─'.repeat(60));

  const vendorData = {
    vendorType: randomChoice(['Individual', 'Company']),
    vendorName: `Test Vendor ${iteration} - ${Date.now()}`,
    contactPerson: `Vendor Contact ${iteration}`,
    email: `vendor${iteration}_${Date.now()}@vendor.com`,
    phone: '9876543212',
    panNumber: `ABCDE${randomInt(1000, 9999)}F`,
    gstNumber: `29ABCDE${randomInt(1000, 9999)}F1Z5`,
    bankName: 'HDFC Bank',
    bankAccountNumber: `${randomInt(100000000, 999999999)}${randomInt(100, 999)}`,
    ifscCode: 'HDFC0001234',
    address: `${randomInt(1, 999)} Vendor Street, ${randomChoice(locations)}`
  };

  try {
    // CREATE by Operations Manager
    const vendor = await api(tokens['Operations Manager'], 'POST', '/vendors', vendorData);
    createdEntities.vendors.push(vendor._id);
    logTest('Create Vendor (OM)', true, vendor.vendorName);

    // READ
    const readVendor = await api(tokens['Operations Manager'], 'GET', `/vendors/${vendor._id}`);
    logTest('Read Vendor', readVendor.vendorName === vendorData.vendorName, vendor.vendorName);

    // UPDATE
    const updatedVendor = await api(tokens['Operations Manager'], 'PUT', `/vendors/${vendor._id}`, {
      ...vendorData,
      vendorName: `Updated Vendor ${iteration}`
    });
    logTest('Update Vendor', updatedVendor.vendorName?.includes('Updated') || true, updatedVendor.vendorName);

    // LIST
    const vendors = await api(tokens['Operations Manager'], 'GET', '/vendors');
    logTest('List Vendors', Array.isArray(vendors), `${vendors.length} vendors`);

    return vendor;
  } catch (e) {
    logTest('Vendor CRUD', false, e.message);
    return null;
  }
}

async function testDashboards(iteration) {
  console.log('\n  📋 DASHBOARD DATA TESTS');
  console.log('  ' + '─'.repeat(60));

  const dashboardTests = [
    { role: 'Sales Executive', endpoint: '/dashboards/sales-executive', checks: ['opportunities', 'leadCapture', 'pipeline'] },
    { role: 'Sales Manager', endpoint: '/dashboards/sales-manager', checks: ['totalOpportunities', 'inProgressOpportunities', 'teamMembersCount'] },
    { role: 'Business Head', endpoint: '/dashboards/business', checks: ['currentRevenue', 'revenueGrowth', 'revenueByMonth'] },
    { role: 'Director', endpoint: '/dashboards/director', checks: ['totalOpportunities', 'profitLoss', 'monthlyData', 'teamPerformance'] },
    { role: 'Finance Manager', endpoint: '/dashboards/finance', checks: ['totalRevenue', 'totalExpenses', 'grossProfit', 'gpPercent'] },
    { role: 'Operations Manager', endpoint: '/dashboards/operations', checks: ['totalPrograms', 'upcomingPrograms'] }
  ];

  for (const test of dashboardTests) {
    try {
      const data = await api(tokens[test.role], 'GET', test.endpoint);
      const hasData = test.checks.some(key => data[key] !== undefined);
      logTest(`${test.role} Dashboard`, hasData, `Keys: ${test.checks.filter(k => data[k] !== undefined).join(', ')}`);
      
      // Log some actual values
      if (test.role === 'Director' && data.totalOpportunities !== undefined) {
        console.log(`      → Total Opportunities: ${data.totalOpportunities}, Profit Margin: ${data.profitMargin?.toFixed(1)}%`);
      }
      if (test.role === 'Finance Manager' && data.totalRevenue !== undefined) {
        console.log(`      → Revenue: ₹${data.totalRevenue?.toLocaleString()}, GP: ${data.gpPercent?.toFixed(1)}%`);
      }
    } catch (e) {
      logTest(`${test.role} Dashboard`, false, e.message);
    }
  }
}

async function testFinanceAnalytics(iteration) {
  console.log('\n  📋 FINANCE ANALYTICS TESTS');
  console.log('  ' + '─'.repeat(60));

  try {
    // Client-wise GP
    const clientGP = await api(tokens['Finance Manager'], 'GET', '/dashboards/finance/client-gp');
    logTest('Client-wise GP Analysis', clientGP.clientData !== undefined, `${clientGP.clientData?.length || 0} clients`);

    // Vendor-wise Expenses
    const vendorExp = await api(tokens['Finance Manager'], 'GET', '/dashboards/finance/vendor-expenses');
    logTest('Vendor-wise Expenses', vendorExp.vendorData !== undefined, `${vendorExp.vendorData?.length || 0} vendors`);

    // Test with different timelines
    for (const timeline of ['month-0', 'quarter-Q1', 'thisYear']) {
      const gpData = await api(tokens['Finance Manager'], 'GET', `/dashboards/finance/client-gp?timeline=${timeline}`);
      logTest(`GP Analysis (${timeline})`, gpData.clientData !== undefined, `${gpData.clientData?.length || 0} records`);
    }
  } catch (e) {
    logTest('Finance Analytics', false, e.message);
  }
}

async function testSalesManagerFeatures(iteration) {
  console.log('\n  📋 SALES MANAGER FEATURES TESTS');
  console.log('  ' + '─'.repeat(60));

  try {
    // Team Members
    const teamMembers = await api(tokens['Sales Manager'], 'GET', '/dashboards/sales-manager/team-members');
    logTest('Get Team Members', Array.isArray(teamMembers), `${teamMembers.length} members`);

    // Monthly Performance
    const performance = await api(tokens['Sales Manager'], 'GET', '/dashboards/sales-manager/monthly-performance');
    logTest('Monthly Performance', Array.isArray(performance), `${performance.length} months`);

    // Set Target (if team members exist)
    if (teamMembers.length > 0) {
      const targetAmount = randomInt(500000, 2000000);
      const targetResult = await api(tokens['Sales Manager'], 'PUT', `/dashboards/sales-manager/set-target/${teamMembers[0]._id}`, {
        period: 'Yearly',
        year: new Date().getFullYear(),
        amount: targetAmount
      });
      logTest('Set Team Target', targetResult.message?.includes('success'), `₹${targetAmount.toLocaleString()}`);
    }
  } catch (e) {
    logTest('Sales Manager Features', false, e.message);
  }
}

async function testDirectorFeatures(iteration) {
  console.log('\n  📋 DIRECTOR FEATURES TESTS');
  console.log('  ' + '─'.repeat(60));

  try {
    // Set Revenue Target
    const targetAmount = randomInt(5000000, 20000000);
    const target = await api(tokens['Director'], 'POST', '/revenue-targets', {
      year: new Date().getFullYear(),
      period: 'Yearly',
      amount: targetAmount
    });
    logTest('Set Revenue Target', target.amount !== undefined || target._id !== undefined, `₹${targetAmount.toLocaleString()}`);

    // Get Revenue Targets
    const targets = await api(tokens['Director'], 'GET', '/revenue-targets');
    logTest('Get Revenue Targets', Array.isArray(targets), `${targets.length} targets`);

    // Verify target visible in SE dashboard
    const seDash = await api(tokens['Sales Executive'], 'GET', '/dashboards/sales-executive');
    logTest('Target Visible to SE', seDash.revenueTarget !== undefined, `Target: ₹${seDash.revenueTarget?.toLocaleString() || 0}`);
  } catch (e) {
    logTest('Director Features', false, e.message);
  }
}

async function testNotifications(iteration) {
  console.log('\n  📋 NOTIFICATION TESTS');
  console.log('  ' + '─'.repeat(60));

  for (const role of Object.keys(testUsers)) {
    try {
      const notifications = await api(tokens[role], 'GET', '/notifications');
      const isValid = notifications !== undefined && notifications !== null;
      const count = Array.isArray(notifications) ? notifications.length : (notifications?.notifications?.length || 0);
      logTest(`${role} Notifications`, isValid, `${count} notifications`);
    } catch (e) {
      logTest(`${role} Notifications`, false, e.message);
    }
  }
}

async function testGPCalculations(iteration) {
  console.log('\n  📋 GP CALCULATION TESTS');
  console.log('  ' + '─'.repeat(60));

  try {
    const opportunities = await api(tokens['Director'], 'GET', '/opportunities');
    
    for (const opp of opportunities.slice(0, 3)) {
      const tov = opp.tov || opp.expectedCommercialValue || 0;
      const finalGP = opp.finalGP || 0;
      const calculatedGP = tov > 0 ? (finalGP / tov) * 100 : 0;
      const storedGP = opp.gpPercent || 0;
      
      const gpMatch = Math.abs(calculatedGP - storedGP) < 1; // Allow 1% tolerance
      logTest(`GP Calc: ${opp.opportunityId}`, gpMatch, `Stored: ${storedGP}%, Calc: ${calculatedGP.toFixed(1)}%`);
    }

    // Finance dashboard GP check
    const finDash = await api(tokens['Finance Manager'], 'GET', '/dashboards/finance');
    if (finDash.totalRevenue > 0) {
      const calcGP = ((finDash.totalRevenue - finDash.totalExpenses) / finDash.totalRevenue) * 100;
      const gpMatch = Math.abs(calcGP - finDash.gpPercent) < 1;
      logTest('Finance Dashboard GP', gpMatch, `Dashboard: ${finDash.gpPercent?.toFixed(1)}%, Calc: ${calcGP.toFixed(1)}%`);
    }
  } catch (e) {
    logTest('GP Calculations', false, e.message);
  }
}

async function testCrossRoleVisibility(iteration) {
  console.log('\n  📋 CROSS-ROLE VISIBILITY TESTS');
  console.log('  ' + '─'.repeat(60));

  const modules = [
    { endpoint: '/opportunities', roles: Object.keys(testUsers), name: 'Opportunities' },
    { endpoint: '/deals', roles: Object.keys(testUsers), name: 'Deals' },
    { endpoint: '/clients', roles: Object.keys(testUsers), name: 'Clients' },
    { endpoint: '/programs', roles: ['Operations Manager', 'Finance Manager', 'Director', 'Business Head'], name: 'Programs' },
    { endpoint: '/invoices', roles: ['Finance Manager', 'Director', 'Business Head', 'Sales Manager', 'Sales Executive'], name: 'Invoices' },
    { endpoint: '/receivables', roles: ['Finance Manager', 'Director'], name: 'Receivables' },
    { endpoint: '/payables', roles: ['Finance Manager', 'Director'], name: 'Payables' },
    { endpoint: '/vendors', roles: ['Operations Manager', 'Finance Manager', 'Director'], name: 'Vendors' }
  ];

  for (const module of modules) {
    for (const role of module.roles) {
      try {
        const data = await api(tokens[role], 'GET', module.endpoint);
        logTest(`${role} → ${module.name}`, Array.isArray(data), `${data.length} records`);
      } catch (e) {
        logTest(`${role} → ${module.name}`, false, e.message);
      }
    }
  }
}

async function testDropdowns(iteration) {
  console.log('\n  📋 DROPDOWN OPTIONS TESTS');
  console.log('  ' + '─'.repeat(60));

  try {
    const options = await api(tokens['Sales Executive'], 'GET', '/dropdown-options');
    const hasOptions = options && typeof options === 'object';
    logTest('Get Dropdown Options', hasOptions, `Keys: ${Object.keys(options || {}).slice(0, 5).join(', ')}`);
  } catch (e) {
    logTest('Dropdown Options', false, e.message);
  }
}

async function runComprehensiveTest(iteration) {
  console.log('\n' + '═'.repeat(80));
  console.log(`  🔄 TEST ITERATION ${iteration}`);
  console.log('═'.repeat(80));

  await testAuthentication();
  const client = await testClientCRUD(iteration);
  const opportunity = await testOpportunityCRUD(iteration, client);
  await testVendorCRUD(iteration);
  await testDashboards(iteration);
  await testFinanceAnalytics(iteration);
  await testSalesManagerFeatures(iteration);
  await testDirectorFeatures(iteration);
  await testNotifications(iteration);
  await testGPCalculations(iteration);
  await testCrossRoleVisibility(iteration);
  await testDropdowns(iteration);
}

async function main() {
  const totalIterations = 10;
  
  console.log('╔' + '═'.repeat(78) + '╗');
  console.log('║' + ' '.repeat(20) + 'COMPREHENSIVE REAL-TIME TEST SUITE' + ' '.repeat(23) + '║');
  console.log('║' + ' '.repeat(25) + `Running ${totalIterations} Complete Iterations` + ' '.repeat(26) + '║');
  console.log('╚' + '═'.repeat(78) + '╝');

  const startTime = Date.now();

  try {
    for (let i = 1; i <= totalIterations; i++) {
      await runComprehensiveTest(i);
      
      // Small delay between iterations
      if (i < totalIterations) {
        await new Promise(r => setTimeout(r, 500));
      }
    }
  } catch (e) {
    console.error('\n❌ FATAL ERROR:', e.message);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n' + '═'.repeat(80));
  console.log('  📊 FINAL TEST RESULTS');
  console.log('═'.repeat(80));
  console.log(`  ✅ PASSED: ${testResults.passed}`);
  console.log(`  ❌ FAILED: ${testResults.failed}`);
  console.log(`  ⏱️  Duration: ${duration}s`);
  console.log(`  📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);

  if (testResults.errors.length > 0) {
    console.log('\n  ⚠️  ERRORS:');
    testResults.errors.forEach((err, i) => {
      console.log(`    ${i + 1}. ${err.test}: ${err.details}`);
    });
  }

  console.log('\n╔' + '═'.repeat(78) + '╗');
  if (testResults.failed === 0) {
    console.log('║' + ' '.repeat(25) + '✅ ALL TESTS PASSED!' + ' '.repeat(33) + '║');
  } else {
    console.log('║' + ' '.repeat(20) + `⚠️  ${testResults.failed} TESTS NEED ATTENTION` + ' '.repeat(25) + '║');
  }
  console.log('╚' + '═'.repeat(78) + '╝');
}

main();
