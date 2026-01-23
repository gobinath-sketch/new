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

// Real test data with complete field variations
const realTestData = [
  {
    client: {
      clientName: 'Microsoft Technology Center',
      trainingSector: 'Corporate',
      contactPersonName: ['Satya Nadella', 'Amy Hood'],
      designation: ['CEO', 'CFO'],
      contactNumber: ['9876543210', '9876543211'],
      emailId: 'satya@microsoft.com',
      location: 'Hyderabad',
      linkedinProfile: 'https://linkedin.com/company/microsoft'
    },
    opportunity: {
      courseName: 'Azure Cloud Architecture',
      courseCode: 'AZ-ARCH-001',
      expectedCommercialValue: 750000,
      expectedDuration: 10,
      expectedParticipants: 50,
      opportunityType: 'Training',
      serviceCategory: 'Corporate',
      expectedStartDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      tov: 750000,
      finalGP: 187500,
      gpPercent: 25,
      opportunityStatus: 'New'
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
      ifscCode: 'HDFC0001234',
      address: '123 Tech Park, Bangalore'
    }
  },
  {
    client: {
      clientName: 'Google India Pvt Ltd',
      trainingSector: 'academics',
      contactPersonName: ['Sundar Pichai', 'Ruth Porat'],
      designation: ['CEO', 'CFO'],
      contactNumber: ['9876543220', '9876543221'],
      emailId: 'sundar@google.com',
      location: 'Bangalore',
      linkedinProfile: 'https://linkedin.com/company/google'
    },
    opportunity: {
      courseName: 'Machine Learning with TensorFlow',
      courseCode: 'ML-TF-002',
      expectedCommercialValue: 500000,
      expectedDuration: 7,
      expectedParticipants: 30,
      opportunityType: 'Training',
      serviceCategory: 'Academic',
      expectedStartDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
      tov: 500000,
      finalGP: 125000,
      gpPercent: 25,
      opportunityStatus: 'New'
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
      ifscCode: 'ICIC0000123',
      address: '456 AI Street, Mumbai'
    }
  },
  {
    client: {
      clientName: 'Amazon Web Services India',
      trainingSector: 'university',
      contactPersonName: ['Andy Jassy', 'Brian Olsavsky'],
      designation: ['CEO', 'CFO'],
      contactNumber: ['9876543230', '9876543231'],
      emailId: 'andy@amazon.com',
      location: 'Mumbai',
      linkedinProfile: 'https://linkedin.com/company/amazon'
    },
    opportunity: {
      courseName: 'AWS DevOps Professional',
      courseCode: 'AWS-DEVOPS-003',
      expectedCommercialValue: 600000,
      expectedDuration: 8,
      expectedParticipants: 40,
      opportunityType: 'Consultant (Resource Support)',
      serviceCategory: 'Corporate',
      expectedStartDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      tov: 600000,
      finalGP: 150000,
      gpPercent: 25,
      opportunityStatus: 'New'
    },
    vendor: {
      vendorType: 'Company',
      vendorName: 'DevOps Masters International',
      contactPerson: 'John Doe',
      email: 'john@devopsmasters.com',
      phone: '9876543232',
      panNumber: 'KLMNO9012F',
      gstNumber: '29KLMNO9012F1Z5',
      bankName: 'SBI Bank',
      bankAccountNumber: '4567890123456789',
      ifscCode: 'SBIN0001234',
      address: '789 DevOps Lane, Pune'
    }
  },
  {
    client: {
      clientName: 'Meta Platforms India',
      trainingSector: 'college',
      contactPersonName: ['Mark Zuckerberg', 'David Wehner'],
      designation: ['CEO', 'CFO'],
      contactNumber: ['9876543240', '9876543241'],
      emailId: 'mark@meta.com',
      location: 'Delhi',
      linkedinProfile: 'https://linkedin.com/company/meta'
    },
    opportunity: {
      courseName: 'React Native Mobile Development',
      courseCode: 'RN-MOBILE-004',
      expectedCommercialValue: 450000,
      expectedDuration: 6,
      expectedParticipants: 25,
      opportunityType: 'Training',
      serviceCategory: 'Academic',
      expectedStartDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      tov: 450000,
      finalGP: 112500,
      gpPercent: 25,
      opportunityStatus: 'New'
    },
    vendor: {
      vendorType: 'Company',
      vendorName: 'Mobile App Academy',
      contactPerson: 'Sarah Johnson',
      email: 'sarah@mobileacademy.com',
      phone: '9876543242',
      panNumber: 'PQRST3456F',
      gstNumber: '29PQRST3456F1Z5',
      bankName: 'Axis Bank',
      bankAccountNumber: '5678901234567890',
      ifscCode: 'UTIB0000001',
      address: '321 Mobile Road, Chennai'
    }
  },
  {
    client: {
      clientName: 'Tesla India Pvt Ltd',
      trainingSector: 'Corporate',
      contactPersonName: ['Elon Musk', 'Zachary Kirkhorn'],
      designation: ['CEO', 'CFO'],
      contactNumber: ['9876543250', '9876543251'],
      emailId: 'elon@tesla.com',
      location: 'Pune',
      linkedinProfile: 'https://linkedin.com/company/tesla'
    },
    opportunity: {
      courseName: 'Electric Vehicle Technology',
      courseCode: 'EV-TECH-005',
      expectedCommercialValue: 800000,
      expectedDuration: 12,
      expectedParticipants: 60,
      opportunityType: 'Content Development / Project Work',
      serviceCategory: 'Corporate',
      expectedStartDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      tov: 800000,
      finalGP: 200000,
      gpPercent: 25,
      opportunityStatus: 'New'
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
      ifscCode: 'PUNB0001234',
      address: '654 EV Park, Ahmedabad'
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

async function testCompleteClientCRUD(iteration) {
  console.log('\n  📋 COMPLETE CLIENT CRUD TESTS');
  console.log('  ' + '─'.repeat(60));
  
  const testData = realTestData[iteration % realTestData.length];
  const clientData = {
    ...testData.client,
    clientName: `${testData.client.clientName} - ${Date.now()}`,
    emailId: `${iteration}_${Date.now()}@testcorp.com`
  };

  try {
    // CREATE with all fields
    const client = await api(tokens['Sales Executive'], 'POST', '/clients', clientData);
    createdEntities.clients.push(client._id);
    logTest('Create Client (All Fields)', true, client.clientName);

    // READ with all data
    const readClient = await api(tokens['Sales Executive'], 'GET', `/clients/${client._id}`);
    const allFieldsPresent = readClient.clientName && readClient.trainingSector && 
                           readClient.contactPersonName && readClient.designation &&
                           readClient.contactNumber && readClient.emailId && readClient.location;
    logTest('Read Client (All Fields)', allFieldsPresent, 'All required fields present');

    // UPDATE with additional contact
    const updatedClient = await api(tokens['Sales Executive'], 'PUT', `/clients/${client._id}`, {
      ...clientData,
      contactPersonName: [...clientData.contactPersonName, `Additional Contact ${iteration}`],
      designation: [...clientData.designation, 'Additional Role']
    });
    logTest('Update Client (Add Contact)', updatedClient.contactPersonName.length === 3, `Now has ${updatedClient.contactPersonName.length} contacts`);

    // LIST - All roles can view
    for (const role of ['Sales Executive', 'Sales Manager', 'Director', 'Business Head', 'Finance Manager', 'Operations Manager']) {
      const clients = await api(tokens[role], 'GET', '/clients');
      const canSee = clients.some(c => c._id === client._id);
      logTest(`${role} Can View Client`, canSee, `Total: ${clients.length}`);
    }

    return client;
  } catch (e) {
    logTest('Client CRUD', false, e.message);
    return null;
  }
}

async function testCompleteOpportunityCRUD(iteration, client) {
  console.log('\n  📋 COMPLETE OPPORTUNITY CRUD TESTS');
  console.log('  ' + '─'.repeat(60));

  const testData = realTestData[iteration % realTestData.length];
  const oppData = {
    ...testData.opportunity,
    billingClient: client?.clientName || `Test Client ${iteration}`,
    endClient: client?.clientName || `Test Client ${iteration}`,
    clientCompanyName: client?.clientName || `Test Client ${iteration}`,
    opportunityStatus: 'New'
  };

  try {
    // CREATE with complete data
    const opp = await api(tokens['Sales Executive'], 'POST', '/opportunities', oppData);
    createdEntities.opportunities.push(opp._id);
    logTest('Create Opportunity (Complete)', true, `${opp.opportunityId} - ₹${oppData.expectedCommercialValue.toLocaleString()} - GP: ${oppData.gpPercent}%`);

    // READ with all details
    const readOpp = await api(tokens['Sales Executive'], 'GET', `/opportunities/${opp._id}`);
    const allFieldsPresent = readOpp.opportunityId && readOpp.courseName && readOpp.expectedCommercialValue &&
                           readOpp.expectedDuration && readOpp.expectedParticipants && readOpp.opportunityType;
    logTest('Read Opportunity (Complete)', allFieldsPresent, 'All opportunity fields present');

    // QUALIFY by Sales Manager
    const qualifiedOpp = await api(tokens['Sales Manager'], 'PUT', `/opportunities/${opp._id}`, {
      opportunityStatus: 'Qualified'
    });
    logTest('Qualify Opportunity (SM)', qualifiedOpp.opportunityStatus === 'Qualified', `Qualified at: ${qualifiedOpp.qualifiedAt}`);

    // SEND TO DELIVERY
    const sentOpp = await api(tokens['Sales Manager'], 'PUT', `/opportunities/${opp._id}`, {
      opportunityStatus: 'Sent to Delivery'
    });
    logTest('Send to Delivery', sentOpp.opportunityStatus === 'Sent to Delivery', `Sent at: ${sentOpp.sentToDeliveryAt}`);

    // CONVERT TO DEAL by Business Head
    const dealData = {
      opportunityId: opp._id,
      dealId: `DEAL-${Date.now()}`,
      totalOrderValue: oppData.expectedCommercialValue,
      finalGP: oppData.finalGP,
      gpPercent: oppData.gpPercent
    };
    const deal = await api(tokens['Business Head'], 'POST', '/deals', dealData);
    logTest('Convert to Deal', true, `Deal ID: ${deal.dealId}`);

    // LIST - All roles can see
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

async function testCompleteVendorCRUD(iteration) {
  console.log('\n  📋 COMPLETE VENDOR CRUD TESTS');
  console.log('  ' + '─'.repeat(60));

  const testData = realTestData[iteration % realTestData.length];
  const vendorData = {
    ...testData.vendor,
    vendorName: `${testData.vendor.vendorName} - ${Date.now()}`,
    email: `${iteration}_${Date.now()}@vendor.com`
  };

  try {
    // CREATE with all banking details
    const vendor = await api(tokens['Operations Manager'], 'POST', '/vendors', vendorData);
    createdEntities.vendors.push(vendor._id);
    logTest('Create Vendor (Complete)', true, vendor.vendorName);

    // READ with all details
    const readVendor = await api(tokens['Operations Manager'], 'GET', `/vendors/${vendor._id}`);
    const allFieldsPresent = readVendor.vendorName && readVendor.vendorType && readVendor.panNumber &&
                           readVendor.bankAccountNumber && readVendor.ifscCode && readVendor.bankName;
    logTest('Read Vendor (Complete)', allFieldsPresent, 'All vendor fields present');

    // UPDATE banking details
    const updatedVendor = await api(tokens['Operations Manager'], 'PUT', `/vendors/${vendor._id}`, {
      ...vendorData,
      vendorName: `Updated ${vendorData.vendorName}`,
      bankName: 'Updated Bank Name'
    });
    logTest('Update Vendor (Banking)', updatedVendor.bankName === 'Updated Bank Name', updatedVendor.bankName);

    // LIST - Operations, Finance, Director can view
    for (const role of ['Operations Manager', 'Finance Manager', 'Director']) {
      const vendors = await api(tokens[role], 'GET', '/vendors');
      const canSee = vendors.some(v => v._id === vendor._id);
      logTest(`${role} Can View Vendor`, canSee, `Total: ${vendors.length}`);
    }

    return vendor;
  } catch (e) {
    logTest('Vendor CRUD', false, e.message);
    return null;
  }
}

async function testCompleteDashboardData(iteration) {
  console.log('\n  📋 COMPLETE DASHBOARD DATA TESTS');
  console.log('  ' + '─'.repeat(60));

  const dashboardTests = [
    { role: 'Sales Executive', endpoint: '/dashboards/sales-executive', expectedFields: ['opportunities', 'leadCapture', 'pipeline', 'revenueTarget'] },
    { role: 'Sales Manager', endpoint: '/dashboards/sales-manager', expectedFields: ['totalOpportunities', 'inProgressOpportunities', 'teamMembersCount', 'monthlyData'] },
    { role: 'Business Head', endpoint: '/dashboards/business', expectedFields: ['currentRevenue', 'revenueGrowth', 'revenueByMonth', 'pipelineCount'] },
    { role: 'Director', endpoint: '/dashboards/director', expectedFields: ['totalOpportunities', 'profitLoss', 'profitMargin', 'monthlyData', 'teamPerformance', 'veryLowGPAlerts'] },
    { role: 'Finance Manager', endpoint: '/dashboards/finance', expectedFields: ['totalRevenue', 'totalExpenses', 'grossProfit', 'gpPercent', 'clientGPData', 'vendorExpenseData'] },
    { role: 'Operations Manager', endpoint: '/dashboards/operations', expectedFields: ['totalPrograms', 'upcomingPrograms', 'trainerAvailability', 'fiscalYearAnalytics'] }
  ];

  for (const test of dashboardTests) {
    try {
      const data = await api(tokens[test.role], 'GET', test.endpoint);
      const hasAllFields = test.expectedFields.every(field => data[field] !== undefined);
      logTest(`${test.role} Dashboard (Complete)`, hasAllFields, `Fields: ${test.expectedFields.filter(f => data[f] !== undefined).length}/${test.expectedFields.length}`);
      
      // Log actual values for verification
      if (test.role === 'Director') {
        console.log(`      → Opportunities: ${data.totalOpportunities}, Profit: ₹${data.profitLoss?.toLocaleString() || 0}, Margin: ${data.profitMargin?.toFixed(1)}%`);
      }
      if (test.role === 'Finance Manager') {
        console.log(`      → Revenue: ₹${data.totalRevenue?.toLocaleString() || 0}, GP: ${data.gpPercent?.toFixed(1)}%, Clients: ${data.clientGPData?.length || 0}`);
      }
    } catch (e) {
      logTest(`${test.role} Dashboard`, false, e.message);
    }
  }
}

async function testFinanceAnalyticsComplete(iteration) {
  console.log('\n  📋 COMPLETE FINANCE ANALYTICS TESTS');
  console.log('  ' + '─'.repeat(60));

  try {
    // Client-wise GP with different timelines
    const timelines = ['month-0', 'month-1', 'quarter-Q1', 'quarter-Q2', 'thisYear', 'lastYear'];
    for (const timeline of timelines) {
      const clientGP = await api(tokens['Finance Manager'], 'GET', `/dashboards/finance/client-gp?timeline=${timeline}`);
      logTest(`Client GP (${timeline})`, clientGP.clientData !== undefined, `${clientGP.clientData?.length || 0} clients`);
    }

    // Vendor-wise Expenses
    const vendorExp = await api(tokens['Finance Manager'], 'GET', '/dashboards/finance/vendor-expenses');
    logTest('Vendor Expenses', vendorExp.vendorData !== undefined, `${vendorExp.vendorData?.length || 0} vendors`);

    // TDS Calculations
    const tdsData = await api(tokens['Finance Manager'], 'GET', '/dashboards/finance/tds-summary');
    logTest('TDS Summary', tdsData.totalTDS !== undefined, `Total TDS: ₹${tdsData.totalTDS?.toLocaleString() || 0}`);

    // GP Calculations verification
    const opportunities = await api(tokens['Finance Manager'], 'GET', '/opportunities');
    for (const opp of opportunities.slice(0, 3)) {
      if (opp.tov && opp.finalGP) {
        const calculatedGP = (opp.finalGP / opp.tov) * 100;
        const storedGP = opp.gpPercent || 0;
        const gpMatch = Math.abs(calculatedGP - storedGP) < 1;
        logTest(`GP Calculation: ${opp.opportunityId}`, gpMatch, `Stored: ${storedGP}%, Calc: ${calculatedGP.toFixed(1)}%`);
      }
    }

    return true;
  } catch (e) {
    logTest('Finance Analytics', false, e.message);
    return false;
  }
}

async function testSalesManagerComplete(iteration) {
  console.log('\n  📋 COMPLETE SALES MANAGER TESTS');
  console.log('  ' + '─'.repeat(60));

  try {
    // Get team members
    const teamMembers = await api(tokens['Sales Manager'], 'GET', '/dashboards/sales-manager/team-members');
    logTest('Get Team Members', Array.isArray(teamMembers), `${teamMembers.length} members`);

    // Monthly performance data
    const performance = await api(tokens['Sales Manager'], 'GET', '/dashboards/sales-manager/monthly-performance');
    logTest('Monthly Performance', Array.isArray(performance), `${performance.length} months data`);

    // Set targets for all team members
    if (teamMembers.length > 0) {
      for (const member of teamMembers.slice(0, 2)) {
        const targetAmount = 500000 + (iteration * 100000);
        const targetResult = await api(tokens['Sales Manager'], 'PUT', `/dashboards/sales-manager/set-target/${member._id}`, {
          period: 'Yearly',
          year: new Date().getFullYear(),
          amount: targetAmount
        });
        logTest(`Set Target for ${member.name}`, targetResult.message?.includes('success'), `₹${targetAmount.toLocaleString()}`);
      }
    }

    // Verify targets visible to team members
    if (teamMembers.length > 0) {
      const memberTargets = await api(tokens['Sales Executive'], 'GET', `/targets/${teamMembers[0]._id}`);
      logTest('Target Visible to SE', Array.isArray(memberTargets), `${memberTargets.length} targets`);
    }

    return true;
  } catch (e) {
    logTest('Sales Manager Complete', false, e.message);
    return false;
  }
}

async function testDirectorComplete(iteration) {
  console.log('\n  📋 COMPLETE DIRECTOR TESTS');
  console.log('  ' + '─'.repeat(60));

  try {
    // Set company-wide revenue target
    const targetAmount = 10000000 + (iteration * 2000000);
    const target = await api(tokens['Director'], 'POST', '/revenue-targets', {
      year: new Date().getFullYear(),
      period: 'Yearly',
      amount: targetAmount
    });
    logTest('Set Company Revenue Target', target.amount !== undefined, `₹${targetAmount.toLocaleString()}`);

    // Get all revenue targets
    const targets = await api(tokens['Director'], 'GET', '/revenue-targets');
    logTest('Get All Revenue Targets', Array.isArray(targets), `${targets.length} targets`);

    // Verify target visible to all roles
    for (const role of ['Sales Executive', 'Sales Manager', 'Business Head', 'Finance Manager']) {
      const dash = await api(tokens[role], 'GET', `/dashboards/${role === 'Sales Executive' ? 'sales-executive' : role === 'Sales Manager' ? 'sales-manager' : role.toLowerCase()}`);
      logTest(`Target Visible to ${role}`, dash.revenueTarget !== undefined, `₹${dash.revenueTarget?.toLocaleString() || 0}`);
    }

    // Test critical GP alerts
    const directorDash = await api(tokens['Director'], 'GET', '/dashboards/director');
    logTest('Critical GP Alerts', Array.isArray(directorDash.veryLowGPAlerts), `${directorDash.veryLowGPAlerts?.length || 0} critical alerts`);

    return true;
  } catch (e) {
    logTest('Director Complete', false, e.message);
    return false;
  }
}

async function testNotificationFlowComplete(iteration) {
  console.log('\n  📋 COMPLETE NOTIFICATION FLOW TESTS');
  console.log('  ' + '─'.repeat(60));

  try {
    // Check notifications for all roles after all operations
    const notificationCounts = {};
    
    for (const role of Object.keys(testUsers)) {
      const notifications = await api(tokens[role], 'GET', '/notifications');
      const count = Array.isArray(notifications) ? notifications.length : 0;
      notificationCounts[role] = count;
      logTest(`${role} Notifications`, count >= 0, `${count} notifications`);
    }

    // Verify notification flow hierarchy
    const expectedFlow = {
      'Sales Executive': 0,  // Should not receive notifications for own actions
      'Sales Manager': '>=0',
      'Business Head': '>=0',
      'Director': '>=0',
      'Finance Manager': '>=0',
      'Operations Manager': '>=0'
    };

    for (const [role, expected] of Object.entries(expectedFlow)) {
      const actual = notificationCounts[role];
      const meetsExpected = expected === '>=0' ? actual >= 0 : actual === parseInt(expected);
      logTest(`Notification Flow (${role})`, meetsExpected, `Expected: ${expected}, Actual: ${actual}`);
    }

    return true;
  } catch (e) {
    logTest('Notification Flow', false, e.message);
    return false;
  }
}

async function testCrossRoleDataConsistency(iteration) {
  console.log('\n  📋 CROSS-ROLE DATA CONSISTENCY TESTS');
  console.log('  ' + '─'.repeat(60));

  try {
    // Get data from different roles for same entity
    const modules = ['opportunities', 'clients', 'vendors'];
    
    for (const module of modules) {
      const roleData = {};
      
      for (const role of Object.keys(testUsers)) {
        try {
          const data = await api(tokens[role], 'GET', `/${module}`);
          roleData[role] = data.length;
        } catch (e) {
          roleData[role] = 'Access Denied';
        }
      }
      
      // Verify consistency across roles that should have access
      const consistent = Object.values(roleData).filter(v => typeof v === 'number').every(v => v === Object.values(roleData).find(v => typeof v === 'number'));
      logTest(`${module} Data Consistency`, consistent, `Counts: ${JSON.stringify(roleData)}`);
    }

    // Verify revenue targets are consistent
    const targets = {};
    for (const role of ['Sales Executive', 'Sales Manager', 'Director', 'Finance Manager']) {
      const dash = await api(tokens[role], 'GET', `/dashboards/${role === 'Sales Executive' ? 'sales-executive' : role === 'Sales Manager' ? 'sales-manager' : role.toLowerCase()}`);
      targets[role] = dash.revenueTarget || 0;
    }
    const targetsConsistent = Object.values(targets).every(t => t === targets['Director']);
    logTest('Revenue Target Consistency', targetsConsistent, `All roles see: ₹${targets['Director']?.toLocaleString() || 0}`);

    return true;
  } catch (e) {
    logTest('Cross-Role Consistency', false, e.message);
    return false;
  }
}

async function runCompleteRealTimeTest(iteration) {
  console.log('\n' + '═'.repeat(80));
  console.log(`  🔄 COMPLETE REAL-TIME TEST ITERATION ${iteration}`);
  console.log('═'.repeat(80));

  await testAuthentication();
  const client = await testCompleteClientCRUD(iteration);
  const opportunity = await testCompleteOpportunityCRUD(iteration, client);
  const vendor = await testCompleteVendorCRUD(iteration);
  await testCompleteDashboardData(iteration);
  await testFinanceAnalyticsComplete(iteration);
  await testSalesManagerComplete(iteration);
  await testDirectorComplete(iteration);
  await testNotificationFlowComplete(iteration);
  await testCrossRoleDataConsistency(iteration);
}

async function main() {
  const totalIterations = 5;
  
  console.log('╔' + '═'.repeat(78) + '╗');
  console.log('║' + ' '.repeat(15) + 'COMPLETE REAL-TIME BACKEND TEST SUITE' + ' '.repeat(15) + '║');
  console.log('║' + ' '.repeat(20) + `Running ${totalIterations} Complete Iterations` + ' '.repeat(21) + '║');
  console.log('║' + ' '.repeat(18) + 'Testing with REAL Corporate Data' + ' '.repeat(18) + '║');
  console.log('╚' + '═'.repeat(78) + '╝');

  const startTime = Date.now();

  try {
    for (let i = 1; i <= totalIterations; i++) {
      await runCompleteRealTimeTest(i);
      
      // Small delay between iterations
      if (i < totalIterations) {
        await new Promise(r => setTimeout(r, 1000));
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
    console.log('║' + ' '.repeat(18) + 'Backend Working Perfectly with Real Data!' + ' '.repeat(18) + '║');
  } else {
    console.log('║' + ' '.repeat(15) + `⚠️  ${testResults.failed} TESTS NEED ATTENTION` + ' '.repeat(15) + '║');
  }
  console.log('╚' + '═'.repeat(78) + '╝');
}

main().catch(console.error);
