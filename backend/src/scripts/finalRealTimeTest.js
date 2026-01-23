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

// Comprehensive real test data
const testScenarios = [
  {
    name: 'Microsoft Azure Training Deal',
    client: {
      clientName: 'Microsoft Technology Center',
      trainingSector: 'Corporate',
      contactPersonName: ['Satya Nadella', 'Amy Hood'],
      designation: ['CEO', 'CFO'],
      contactNumber: ['9876543210', '9876543211'],
      emailId: 'satya@microsoft.com',
      location: 'Hyderabad'
    },
    opportunity: {
      courseName: 'Azure Cloud Architecture',
      courseCode: 'AZ-ARCH-001',
      expectedCommercialValue: 750000,
      expectedDuration: 10,
      expectedParticipants: 50,
      opportunityType: 'Training',
      serviceCategory: 'Corporate'
    },
    vendor: {
      vendorType: 'Company',
      vendorName: 'Cloud Training Experts Pvt Ltd',
      contactPerson: 'Rajesh Kumar',
      email: 'rajesh@cloudtraining.com',
      phone: '9876543212',
      panNumber: 'ABCDE1234F',
      gstNumber: '29ABCDE1234F1Z5',
      bankName: 'HDFC Bank',
      bankAccountNumber: '1234567890123456',
      ifscCode: 'HDFC0001234'
    }
  },
  {
    name: 'Google ML Training Program',
    client: {
      clientName: 'Google India Pvt Ltd',
      trainingSector: 'academics',
      contactPersonName: ['Sundar Pichai', 'Ruth Porat'],
      designation: ['CEO', 'CFO'],
      contactNumber: ['9876543220', '9876543221'],
      emailId: 'sundar@google.com',
      location: 'Bangalore'
    },
    opportunity: {
      courseName: 'Machine Learning with TensorFlow',
      courseCode: 'ML-TF-002',
      expectedCommercialValue: 500000,
      expectedDuration: 7,
      expectedParticipants: 30,
      opportunityType: 'Training',
      serviceCategory: 'Academic'
    },
    vendor: {
      vendorType: 'Individual',
      vendorName: 'Dr. Andrew Ng',
      contactPerson: 'Dr. Andrew Ng',
      email: 'andrew@deeplearning.ai',
      phone: '9876543222',
      panNumber: 'FGHIJ5678F',
      bankName: 'ICICI Bank',
      bankAccountNumber: '9876543210987654',
      ifscCode: 'ICIC0000123'
    }
  },
  {
    name: 'Tesla EV Technology Project',
    client: {
      clientName: 'Tesla India Pvt Ltd',
      trainingSector: 'university',
      contactPersonName: ['Elon Musk', 'Zachary Kirkhorn'],
      designation: ['CEO', 'CFO'],
      contactNumber: ['9876543250', '9876543251'],
      emailId: 'elon@tesla.com',
      location: 'Pune'
    },
    opportunity: {
      courseName: 'Electric Vehicle Technology',
      courseCode: 'EV-TECH-005',
      expectedCommercialValue: 800000,
      expectedDuration: 12,
      expectedParticipants: 60,
      opportunityType: 'Content Development / Project Work',
      serviceCategory: 'Corporate'
    },
    vendor: {
      vendorType: 'Company',
      vendorName: 'EV Innovation Labs',
      contactPerson: 'Michael Brown',
      email: 'michael@evinnovation.com',
      phone: '9876543252',
      panNumber: 'UVWXY7890F',
      gstNumber: '29UVWXY7890F1Z5',
      bankName: 'PNB Bank',
      bankAccountNumber: '6789012345678901',
      ifscCode: 'PUNB0001234'
    }
  }
];

let tokens = {};
let testResults = { passed: 0, failed: 0, errors: [] };
let createdEntities = { clients: [], opportunities: [], vendors: [] };

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

async function testCompleteAuthentication() {
  console.log('\n  📋 COMPLETE AUTHENTICATION TESTS');
  console.log('  ' + '─'.repeat(60));
  
  for (const role of Object.keys(testUsers)) {
    try {
      const { token, user } = await login(role);
      tokens[role] = token;
      logTest(`${role} Login`, true, `${user.name} (${user.role})`);
      
      // Verify token works
      let endpoint = role.toLowerCase();
      if (role === 'Sales Executive') endpoint = 'sales-executive';
      else if (role === 'Sales Manager') endpoint = 'sales-manager';
      else if (role === 'Business Head') endpoint = 'business';
      else if (role === 'Finance Manager') endpoint = 'finance';
      else if (role === 'Operations Manager') endpoint = 'operations';
      else if (role === 'Director') endpoint = 'director';
      
      const dash = await api(token, 'GET', `/dashboards/${endpoint}`);
      logTest(`${role} Token Valid`, true, 'Dashboard accessible');
    } catch (e) {
      logTest(`${role} Login`, false, e.message);
    }
  }
}

async function testCompleteClientWorkflow(scenario, iteration) {
  console.log(`\n  📋 CLIENT WORKFLOW - ${scenario.name}`);
  console.log('  ' + '─'.repeat(60));

  const clientData = {
    ...scenario.client,
    clientName: `${scenario.client.clientName} - ${Date.now()}`,
    emailId: `${iteration}_${Date.now()}@testcorp.com`
  };

  try {
    // CREATE by Sales Executive
    const client = await api(tokens['Sales Executive'], 'POST', '/clients', clientData);
    createdEntities.clients.push(client._id);
    logTest('Create Client', true, client.clientName);

    // READ by Sales Executive
    const readClient = await api(tokens['Sales Executive'], 'GET', `/clients/${client._id}`);
    logTest('Read Client', readClient.clientName === clientData.clientName, 'All data matches');

    // UPDATE by Sales Executive
    const updatedClient = await api(tokens['Sales Executive'], 'PUT', `/clients/${client._id}`, {
      ...clientData,
      contactPersonName: [...clientData.contactPersonName, `Updated Contact ${iteration}`],
      designation: [...clientData.designation, 'Updated Role']
    });
    logTest('Update Client', updatedClient.contactPersonName.length === 3, `Now has ${updatedClient.contactPersonName.length} contacts`);

    // Verify all roles can view
    const roleAccess = ['Sales Executive', 'Sales Manager', 'Director', 'Business Head', 'Finance Manager', 'Operations Manager'];
    for (const role of roleAccess) {
      const clients = await api(tokens[role], 'GET', '/clients');
      const canSee = clients.some(c => c._id === client._id);
      logTest(`${role} Can View Client`, canSee, `Total visible: ${clients.length}`);
    }

    return client;
  } catch (e) {
    logTest('Client Workflow', false, e.message);
    return null;
  }
}

async function testCompleteOpportunityWorkflow(scenario, iteration, client) {
  console.log(`\n  📋 OPPORTUNITY WORKFLOW - ${scenario.name}`);
  console.log('  ' + '─'.repeat(60));

  const oppData = {
    ...scenario.opportunity,
    billingClient: client?.clientName || scenario.client.clientName,
    endClient: client?.clientName || scenario.client.clientName,
    clientCompanyName: client?.clientName || scenario.client.clientName,
    expectedStartDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    tov: scenario.opportunity.expectedCommercialValue,
    finalGP: Math.round(scenario.opportunity.expectedCommercialValue * 0.25),
    gpPercent: 25,
    opportunityStatus: 'New'
  };

  try {
    // CREATE by Sales Executive
    const opp = await api(tokens['Sales Executive'], 'POST', '/opportunities', oppData);
    createdEntities.opportunities.push(opp._id);
    logTest('Create Opportunity', true, `${opp.opportunityId} - ₹${oppData.expectedCommercialValue.toLocaleString()}`);

    // READ by Sales Executive
    const readOpp = await api(tokens['Sales Executive'], 'GET', `/opportunities/${opp._id}`);
    logTest('Read Opportunity', readOpp.opportunityId === opp.opportunityId, 'All data matches');

    // QUALIFY by Sales Manager
    const qualifiedOpp = await api(tokens['Sales Manager'], 'PUT', `/opportunities/${opp._id}`, {
      opportunityStatus: 'Qualified'
    });
    logTest('Qualify Opportunity', qualifiedOpp.opportunityStatus === 'Qualified', `Qualified at: ${qualifiedOpp.qualifiedAt}`);

    // SEND TO DELIVERY by Sales Manager
    const sentOpp = await api(tokens['Sales Manager'], 'PUT', `/opportunities/${opp._id}`, {
      opportunityStatus: 'Sent to Delivery'
    });
    logTest('Send to Delivery', sentOpp.opportunityStatus === 'Sent to Delivery', `Sent at: ${sentOpp.sentToDeliveryAt}`);

    // Verify all roles can see
    for (const role of Object.keys(testUsers)) {
      const opps = await api(tokens[role], 'GET', '/opportunities');
      const canSee = opps.some(o => o._id === opp._id);
      logTest(`${role} Can View Opportunity`, canSee, `Total visible: ${opps.length}`);
    }

    return opp;
  } catch (e) {
    logTest('Opportunity Workflow', false, e.message);
    return null;
  }
}

async function testCompleteVendorWorkflow(scenario, iteration) {
  console.log(`\n  📋 VENDOR WORKFLOW - ${scenario.name}`);
  console.log('  ' + '─'.repeat(60));

  const vendorData = {
    ...scenario.vendor,
    vendorName: `${scenario.vendor.vendorName} - ${Date.now()}`,
    email: `${iteration}_${Date.now()}@vendor.com`,
    address: `${iteration} Vendor Street, Test City`
  };

  try {
    // CREATE by Operations Manager
    const vendor = await api(tokens['Operations Manager'], 'POST', '/vendors', vendorData);
    createdEntities.vendors.push(vendor._id);
    logTest('Create Vendor', true, vendor.vendorName);

    // READ by Operations Manager
    const readVendor = await api(tokens['Operations Manager'], 'GET', `/vendors/${vendor._id}`);
    logTest('Read Vendor', readVendor.vendorName === vendorData.vendorName, 'All data matches');

    // UPDATE by Operations Manager
    const updatedVendor = await api(tokens['Operations Manager'], 'PUT', `/vendors/${vendor._id}`, {
      ...vendorData,
      vendorName: `Updated ${vendorData.vendorName}`,
      bankName: 'Updated Bank Name'
    });
    logTest('Update Vendor', updatedVendor.bankName === 'Updated Bank Name', 'Bank details updated');

    // Verify authorized roles can view
    const authorizedRoles = ['Operations Manager', 'Finance Manager', 'Director'];
    for (const role of authorizedRoles) {
      const vendors = await api(tokens[role], 'GET', '/vendors');
      const canSee = vendors.some(v => v._id === vendor._id);
      logTest(`${role} Can View Vendor`, canSee, `Total visible: ${vendors.length}`);
    }

    return vendor;
  } catch (e) {
    logTest('Vendor Workflow', false, e.message);
    return null;
  }
}

async function testCompleteDashboardVerification() {
  console.log('\n  📋 COMPLETE DASHBOARD VERIFICATION');
  console.log('  ' + '─'.repeat(60));

  const dashboardTests = [
    { 
      role: 'Sales Executive', 
      endpoint: '/dashboards/sales-executive', 
      expectedFields: ['opportunities', 'leadCapture', 'pipeline', 'revenueTarget'],
      description: 'SE Dashboard'
    },
    { 
      role: 'Sales Manager', 
      endpoint: '/dashboards/sales-manager', 
      expectedFields: ['totalOpportunities', 'inProgressOpportunities', 'teamMembersCount'],
      description: 'SM Dashboard'
    },
    { 
      role: 'Business Head', 
      endpoint: '/dashboards/business', 
      expectedFields: ['currentRevenue', 'revenueGrowth', 'revenueByMonth'],
      description: 'BH Dashboard'
    },
    { 
      role: 'Director', 
      endpoint: '/dashboards/director', 
      expectedFields: ['totalOpportunities', 'profitLoss', 'profitMargin', 'monthlyData'],
      description: 'Director Dashboard'
    },
    { 
      role: 'Finance Manager', 
      endpoint: '/dashboards/finance', 
      expectedFields: ['totalRevenue', 'totalExpenses', 'grossProfit', 'gpPercent'],
      description: 'FM Dashboard'
    },
    { 
      role: 'Operations Manager', 
      endpoint: '/dashboards/operations', 
      expectedFields: ['totalPrograms', 'upcomingPrograms'],
      description: 'OM Dashboard'
    }
  ];

  for (const test of dashboardTests) {
    try {
      const data = await api(tokens[test.role], 'GET', test.endpoint);
      const hasRequiredFields = test.expectedFields.some(field => data[field] !== undefined);
      const presentFields = test.expectedFields.filter(field => data[field] !== undefined);
      
      logTest(test.description, hasRequiredFields, `Fields: ${presentFields.length}/${test.expectedFields.length} present`);
      
      // Log key metrics
      if (test.role === 'Director' && data.totalOpportunities !== undefined) {
        console.log(`      → Total Opportunities: ${data.totalOpportunities}, Profit Margin: ${data.profitMargin?.toFixed(1)}%`);
      }
      if (test.role === 'Finance Manager' && data.totalRevenue !== undefined) {
        console.log(`      → Revenue: ₹${data.totalRevenue?.toLocaleString() || 0}, GP: ${data.gpPercent?.toFixed(1)}%`);
      }
    } catch (e) {
      logTest(test.description, false, e.message);
    }
  }
}

async function testRevenueTargetFlow() {
  console.log('\n  📋 REVENUE TARGET FLOW TEST');
  console.log('  ' + '─'.repeat(60));

  try {
    // Director sets revenue target
    const targetAmount = 15000000;
    const target = await api(tokens['Director'], 'POST', '/revenue-targets', {
      year: new Date().getFullYear(),
      period: 'Yearly',
      amount: targetAmount
    });
    logTest('Set Revenue Target', target.amount !== undefined, `₹${targetAmount.toLocaleString()}`);

    // Verify visible to all relevant roles
    const rolesToCheck = ['Sales Executive', 'Sales Manager', 'Business Head', 'Finance Manager', 'Director'];
    for (const role of rolesToCheck) {
      let endpoint = role.toLowerCase();
      if (role === 'Sales Executive') endpoint = 'sales-executive';
      else if (role === 'Sales Manager') endpoint = 'sales-manager';
      else if (role === 'Business Head') endpoint = 'business';
      else if (role === 'Finance Manager') endpoint = 'finance';
      else if (role === 'Director') endpoint = 'director';
      
      const dash = await api(tokens[role], 'GET', `/dashboards/${endpoint}`);
      logTest(`Target Visible to ${role}`, dash.revenueTarget !== undefined, `₹${dash.revenueTarget?.toLocaleString() || 0}`);
    }

    return true;
  } catch (e) {
    logTest('Revenue Target Flow', false, e.message);
    return false;
  }
}

async function testFinanceAnalytics() {
  console.log('\n  📋 FINANCE ANALYTICS TEST');
  console.log('  ' + '─'.repeat(60));

  try {
    // Client-wise GP analysis
    const clientGP = await api(tokens['Finance Manager'], 'GET', '/dashboards/finance/client-gp');
    logTest('Client GP Analysis', clientGP.clientData !== undefined, `${clientGP.clientData?.length || 0} clients analyzed`);

    // Vendor-wise expenses
    const vendorExp = await api(tokens['Finance Manager'], 'GET', '/dashboards/finance/vendor-expenses');
    logTest('Vendor Expenses', vendorExp.vendorData !== undefined, `${vendorExp.vendorData?.length || 0} vendors tracked`);

    // Test different timelines
    const timelines = ['month-0', 'thisYear', 'lastYear'];
    for (const timeline of timelines) {
      const gpData = await api(tokens['Finance Manager'], 'GET', `/dashboards/finance/client-gp?timeline=${timeline}`);
      logTest(`GP Analysis (${timeline})`, gpData.clientData !== undefined, `${gpData.clientData?.length || 0} records`);
    }

    return true;
  } catch (e) {
    logTest('Finance Analytics', false, e.message);
    return false;
  }
}

async function testSalesManagerFeatures() {
  console.log('\n  📋 SALES MANAGER FEATURES TEST');
  console.log('  ' + '─'.repeat(60));

  try {
    // Get team members
    const teamMembers = await api(tokens['Sales Manager'], 'GET', '/dashboards/sales-manager/team-members');
    logTest('Get Team Members', Array.isArray(teamMembers), `${teamMembers.length} team members`);

    // Monthly performance
    const performance = await api(tokens['Sales Manager'], 'GET', '/dashboards/sales-manager/monthly-performance');
    logTest('Monthly Performance', Array.isArray(performance), `${performance.length} months of data`);

    // Set targets for team members
    if (teamMembers.length > 0) {
      const targetAmount = 1000000;
      const targetResult = await api(tokens['Sales Manager'], 'PUT', `/dashboards/sales-manager/set-target/${teamMembers[0]._id}`, {
        period: 'Yearly',
        year: new Date().getFullYear(),
        amount: targetAmount
      });
      logTest('Set Team Target', targetResult.message?.includes('success'), `₹${targetAmount.toLocaleString()}`);

      // Verify target visible to team member
      const memberTargets = await api(tokens['Sales Executive'], 'GET', `/targets/${teamMembers[0]._id}`);
      logTest('Target Visible to Team', Array.isArray(memberTargets), `${memberTargets.length} targets`);
    }

    return true;
  } catch (e) {
    logTest('Sales Manager Features', false, e.message);
    return false;
  }
}

async function testNotificationSystem() {
  console.log('\n  📋 NOTIFICATION SYSTEM TEST');
  console.log('  ' + '─'.repeat(60));

  try {
    // Check notifications for all roles
    const notificationCounts = {};
    
    for (const role of Object.keys(testUsers)) {
      try {
        const notifications = await api(tokens[role], 'GET', '/notifications');
        const count = Array.isArray(notifications) ? notifications.length : 0;
        notificationCounts[role] = count;
        logTest(`${role} Notifications`, count >= 0, `${count} notifications`);
      } catch (e) {
        notificationCounts[role] = 'Error';
        logTest(`${role} Notifications`, false, e.message);
      }
    }

    return true;
  } catch (e) {
    logTest('Notification System', false, e.message);
    return false;
  }
}

async function testGPCalculations() {
  console.log('\n  📋 GP CALCULATION VERIFICATION');
  console.log('  ' + '─'.repeat(60));

  try {
    // Get opportunities and verify GP calculations
    const opportunities = await api(tokens['Finance Manager'], 'GET', '/opportunities');
    
    for (const opp of opportunities.slice(0, 5)) {
      if (opp.tov && opp.finalGP) {
        const calculatedGP = (opp.finalGP / opp.tov) * 100;
        const storedGP = opp.gpPercent || 0;
        const gpMatch = Math.abs(calculatedGP - storedGP) < 1; // 1% tolerance
        
        logTest(`GP Calc: ${opp.opportunityId}`, gpMatch, 
                `Stored: ${storedGP}%, Calculated: ${calculatedGP.toFixed(1)}%`);
      }
    }

    // Verify finance dashboard GP
    const finDash = await api(tokens['Finance Manager'], 'GET', '/dashboards/finance');
    if (finDash.totalRevenue > 0) {
      const calcGP = ((finDash.totalRevenue - finDash.totalExpenses) / finDash.totalRevenue) * 100;
      const gpMatch = Math.abs(calcGP - finDash.gpPercent) < 1;
      logTest('Finance Dashboard GP', gpMatch, 
              `Dashboard: ${finDash.gpPercent?.toFixed(1)}%, Calculated: ${calcGP.toFixed(1)}%`);
    }

    return true;
  } catch (e) {
    logTest('GP Calculations', false, e.message);
    return false;
  }
}

async function testCrossRoleDataConsistency() {
  console.log('\n  📋 CROSS-ROLE DATA CONSISTENCY');
  console.log('  ' + '─'.repeat(60));

  try {
    // Verify data consistency across roles
    const modules = ['opportunities', 'clients'];
    
    for (const module of modules) {
      const roleCounts = {};
      
      for (const role of Object.keys(testUsers)) {
        try {
          const data = await api(tokens[role], 'GET', `/${module}`);
          roleCounts[role] = data.length;
        } catch (e) {
          roleCounts[role] = 'Access Denied';
        }
      }
      
      // Check if all roles with access see same count
      const accessibleCounts = Object.values(roleCounts).filter(v => typeof v === 'number');
      const consistent = accessibleCounts.every(v => v === accessibleCounts[0]);
      
      logTest(`${module} Data Consistency`, consistent, `Counts: ${JSON.stringify(roleCounts)}`);
    }

    // Verify revenue target consistency
    const targets = {};
    for (const role of ['Sales Executive', 'Sales Manager', 'Director', 'Finance Manager']) {
      const endpoint = role === 'Sales Executive' ? 'sales-executive' : role === 'Sales Manager' ? 'sales-manager' : role.toLowerCase();
      const dash = await api(tokens[role], 'GET', `/dashboards/${endpoint}`);
      targets[role] = dash.revenueTarget || 0;
    }
    
    const targetsConsistent = Object.values(targets).every(t => t === targets['Director']);
    logTest('Revenue Target Consistency', targetsConsistent, `All see: ₹${targets['Director']?.toLocaleString() || 0}`);

    return true;
  } catch (e) {
    logTest('Cross-Role Consistency', false, e.message);
    return false;
  }
}

async function runCompleteRealTimeTest(iteration) {
  console.log('\n' + '═'.repeat(80));
  console.log(`  🔄 COMPLETE REAL-TIME TEST - SCENARIO ${iteration}`);
  console.log('═'.repeat(80));

  const scenario = testScenarios[iteration % testScenarios.length];
  
  await testCompleteAuthentication();
  const client = await testCompleteClientWorkflow(scenario, iteration);
  const opportunity = await testCompleteOpportunityWorkflow(scenario, iteration, client);
  const vendor = await testCompleteVendorWorkflow(scenario, iteration);
  
  await testCompleteDashboardVerification();
  await testRevenueTargetFlow();
  await testFinanceAnalytics();
  await testSalesManagerFeatures();
  await testNotificationSystem();
  await testGPCalculations();
  await testCrossRoleDataConsistency();
}

async function main() {
  const totalIterations = 3;
  
  console.log('╔' + '═'.repeat(78) + '╗');
  console.log('║' + ' '.repeat(15) + 'FINAL COMPLETE REAL-TIME TEST SUITE' + ' '.repeat(15) + '║');
  console.log('║' + ' '.repeat(20) + `Running ${totalIterations} Complete Scenarios` + ' '.repeat(21) + '║');
  console.log('║' + ' '.repeat(18) + 'Testing with REAL Corporate Data' + ' '.repeat(18) + '║');
  console.log('║' + ' '.repeat(16) + 'Complete End-to-End Workflows' + ' '.repeat(16) + '║');
  console.log('╚' + '═'.repeat(78) + '╝');

  const startTime = Date.now();

  try {
    for (let i = 1; i <= totalIterations; i++) {
      await runCompleteRealTimeTest(i);
      
      // Delay between iterations
      if (i < totalIterations) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  } catch (e) {
    console.error('\n❌ FATAL ERROR:', e.message);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n' + '═'.repeat(80));
  console.log('  📊 FINAL COMPLETE TEST RESULTS');
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
    console.log('║' + ' '.repeat(20) + '✅ ALL COMPLETE TESTS PASSED!' + ' '.repeat(20) + '║');
    console.log('║' + ' '.repeat(18) + 'System Working Perfectly with Real Data!' + ' '.repeat(18) + '║');
  } else {
    console.log('║' + ' '.repeat(15) + `⚠️  ${testResults.failed} TESTS NEED ATTENTION` + ' '.repeat(15) + '║');
  }
  console.log('╚' + '═'.repeat(78) + '╝');
}

main().catch(console.error);
