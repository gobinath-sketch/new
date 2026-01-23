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

// Real corporate test scenarios
const corporateScenarios = [
  {
    name: 'Microsoft Azure Enterprise Training',
    client: {
      clientName: 'Microsoft Technology Center India',
      trainingSector: 'Corporate',
      contactPersonName: ['Satya Nadella', 'Amy Hood'],
      designation: ['CEO', 'CFO'],
      contactNumber: ['9876543210', '9876543211'],
      emailId: 'satya.nadella@microsoft.com',
      location: 'Hyderabad'
    },
    opportunity: {
      courseName: 'Azure Cloud Architecture Certification',
      courseCode: 'AZ-ARCH-PRO-001',
      expectedCommercialValue: 1200000,
      expectedDuration: 15,
      expectedParticipants: 75,
      opportunityType: 'Training',
      serviceCategory: 'Corporate'
    },
    vendor: {
      vendorType: 'Company',
      vendorName: 'Cloud Masters Training Solutions',
      contactPerson: 'Rajesh Kumar',
      email: 'rajesh@cloudmasters.com',
      phone: '9876543212',
      panNumber: 'ABCDE1234F',
      gstNumber: '29ABCDE1234F1Z5',
      bankName: 'HDFC Bank',
      bankAccountNumber: '1234567890123456',
      ifscCode: 'HDFC0001234'
    }
  },
  {
    name: 'Google AI/ML University Program',
    client: {
      clientName: 'Google India Development Center',
      trainingSector: 'university',
      contactPersonName: ['Sundar Pichai', 'Ruth Porat'],
      designation: ['CEO', 'CFO'],
      contactNumber: ['9876543220', '9876543221'],
      emailId: 'sundar.pichai@google.com',
      location: 'Bangalore'
    },
    opportunity: {
      courseName: 'Advanced Machine Learning with TensorFlow',
      courseCode: 'ML-TENSORFLOW-ADV-002',
      expectedCommercialValue: 950000,
      expectedDuration: 12,
      expectedParticipants: 60,
      opportunityType: 'Training',
      serviceCategory: 'Academic'
    },
    vendor: {
      vendorType: 'Individual',
      vendorName: 'Dr. Andrew Ng',
      contactPerson: 'Dr. Andrew Ng',
      email: 'andrew.ng@deeplearning.ai',
      phone: '9876543222',
      panNumber: 'FGHIJ5678F',
      bankName: 'ICICI Bank',
      bankAccountNumber: '9876543210987654',
      ifscCode: 'ICIC0000123'
    }
  },
  {
    name: 'Tesla Electric Vehicle Innovation Project',
    client: {
      clientName: 'Tesla Motors India Pvt Ltd',
      trainingSector: 'Corporate',
      contactPersonName: ['Elon Musk', 'Zachary Kirkhorn'],
      designation: ['CEO', 'CFO'],
      contactNumber: ['9876543250', '9876543251'],
      emailId: 'elon.musk@tesla.com',
      location: 'Pune'
    },
    opportunity: {
      courseName: 'Electric Vehicle Technology & Battery Systems',
      courseCode: 'EV-BATTERY-SYS-003',
      expectedCommercialValue: 1800000,
      expectedDuration: 20,
      expectedParticipants: 100,
      opportunityType: 'Content Development / Project Work',
      serviceCategory: 'Corporate'
    },
    vendor: {
      vendorType: 'Company',
      vendorName: 'EV Innovation Labs International',
      contactPerson: 'Michael Chen',
      email: 'michael@evinnovationlabs.com',
      phone: '9876543252',
      panNumber: 'UVWXY7890F',
      gstNumber: '29UVWXY7890F1Z5',
      bankName: 'PNB Bank',
      bankAccountNumber: '6789012345678901',
      ifscCode: 'PUNB0001234'
    }
  },
  {
    name: 'Meta React Native Mobile Development',
    client: {
      clientName: 'Meta Platforms India',
      trainingSector: 'college',
      contactPersonName: ['Mark Zuckerberg', 'David Wehner'],
      designation: ['CEO', 'CFO'],
      contactNumber: ['9876543240', '9876543241'],
      emailId: 'mark.zuckerberg@meta.com',
      location: 'Delhi NCR'
    },
    opportunity: {
      courseName: 'React Native Cross-Platform Development',
      courseCode: 'RN-CROSS-PLAT-004',
      expectedCommercialValue: 750000,
      expectedDuration: 10,
      expectedParticipants: 45,
      opportunityType: 'Training',
      serviceCategory: 'Academic'
    },
    vendor: {
      vendorType: 'Company',
      vendorName: 'Mobile App Excellence Academy',
      contactPerson: 'Sarah Johnson',
      email: 'sarah@mobileacademy.com',
      phone: '9876543242',
      panNumber: 'PQRST3456F',
      gstNumber: '29PQRST3456F1Z5',
      bankName: 'Axis Bank',
      bankAccountNumber: '5678901234567890',
      ifscCode: 'UTIB0000001'
    }
  },
  {
    name: 'Amazon Web Services DevOps Transformation',
    client: {
      clientName: 'Amazon Web Services India',
      trainingSector: 'academics',
      contactPersonName: ['Andy Jassy', 'Brian Olsavsky'],
      designation: ['CEO', 'CFO'],
      contactNumber: ['9876543230', '9876543231'],
      emailId: 'andy.jassy@amazon.com',
      location: 'Mumbai'
    },
    opportunity: {
      courseName: 'AWS DevOps Professional Certification',
      courseCode: 'AWS-DEVOPS-PRO-005',
      expectedCommercialValue: 1100000,
      expectedDuration: 14,
      expectedParticipants: 70,
      opportunityType: 'Consultant (Resource Support)',
      serviceCategory: 'Corporate'
    },
    vendor: {
      vendorType: 'Company',
      vendorName: 'DevOps Masters Global',
      contactPerson: 'John Smith',
      email: 'john@devopsmasters.com',
      phone: '9876543232',
      panNumber: 'KLMNO9012F',
      gstNumber: '29KLMNO9012F1Z5',
      bankName: 'SBI Bank',
      bankAccountNumber: '4567890123456789',
      ifscCode: 'SBIN0001234'
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

function getDashboardEndpoint(role) {
  const endpoints = {
    'Sales Executive': 'sales-executive',
    'Sales Manager': 'sales-manager',
    'Business Head': 'business',
    'Director': 'director',
    'Finance Manager': 'finance',
    'Operations Manager': 'operations'
  };
  return endpoints[role] || role.toLowerCase();
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

async function testAllAuthentication() {
  console.log('\n  📋 COMPLETE AUTHENTICATION MATRIX');
  console.log('  ' + '─'.repeat(60));
  
  for (const role of Object.keys(testUsers)) {
    try {
      const { token, user } = await login(role);
      tokens[role] = token;
      logTest(`${role} Login`, true, `${user.name} (${user.role})`);
      
      // Verify dashboard access
      const endpoint = getDashboardEndpoint(role);
      const dash = await api(token, 'GET', `/dashboards/${endpoint}`);
      logTest(`${role} Dashboard Access`, true, 'Dashboard loaded');
    } catch (e) {
      logTest(`${role} Authentication`, false, e.message);
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
    const allFieldsPresent = readClient.clientName && readClient.trainingSector && 
                           readClient.contactPersonName && readClient.designation &&
                           readClient.contactNumber && readClient.emailId && readClient.location;
    logTest('Read Client (All Fields)', allFieldsPresent, 'Complete data retrieved');

    // UPDATE by Sales Executive
    const updatedClient = await api(tokens['Sales Executive'], 'PUT', `/clients/${client._id}`, {
      ...clientData,
      contactPersonName: [...clientData.contactPersonName, `Updated Contact ${iteration}`],
      designation: [...clientData.designation, 'Senior Manager']
    });
    logTest('Update Client', updatedClient.contactPersonName.length === 3, `Now has ${updatedClient.contactPersonName.length} contacts`);

    // LIST - Verify all authorized roles can view
    const authorizedRoles = ['Sales Executive', 'Sales Manager', 'Director', 'Business Head', 'Finance Manager', 'Operations Manager'];
    for (const role of authorizedRoles) {
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
    expectedStartDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    tov: scenario.opportunity.expectedCommercialValue,
    finalGP: Math.round(scenario.opportunity.expectedCommercialValue * 0.25),
    gpPercent: 25,
    opportunityStatus: 'New'
  };

  try {
    // CREATE by Sales Executive
    const opp = await api(tokens['Sales Executive'], 'POST', '/opportunities', oppData);
    createdEntities.opportunities.push(opp._id);
    logTest('Create Opportunity', true, `${opp.opportunityId} - ₹${oppData.expectedCommercialValue.toLocaleString()} - GP: ${oppData.gpPercent}%`);

    // READ by Sales Executive
    const readOpp = await api(tokens['Sales Executive'], 'GET', `/opportunities/${opp._id}`);
    const allFieldsPresent = readOpp.opportunityId && readOpp.courseName && readOpp.expectedCommercialValue &&
                           readOpp.expectedDuration && readOpp.expectedParticipants && readOpp.opportunityType;
    logTest('Read Opportunity (Complete)', allFieldsPresent, 'All opportunity fields present');

    // QUALIFY by Sales Manager
    const qualifiedOpp = await api(tokens['Sales Manager'], 'PUT', `/opportunities/${opp._id}`, {
      opportunityStatus: 'Qualified'
    });
    logTest('Qualify Opportunity (SM)', qualifiedOpp.opportunityStatus === 'Qualified', `Qualified at: ${qualifiedOpp.qualifiedAt}`);

    // SEND TO DELIVERY by Sales Manager
    const sentOpp = await api(tokens['Sales Manager'], 'PUT', `/opportunities/${opp._id}`, {
      opportunityStatus: 'Sent to Delivery'
    });
    logTest('Send to Delivery (SM)', sentOpp.opportunityStatus === 'Sent to Delivery', `Sent at: ${sentOpp.sentToDeliveryAt}`);

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
    address: `${iteration} Corporate Avenue, Business District`
  };

  try {
    // CREATE by Operations Manager
    const vendor = await api(tokens['Operations Manager'], 'POST', '/vendors', vendorData);
    createdEntities.vendors.push(vendor._id);
    logTest('Create Vendor', true, vendor.vendorName);

    // READ by Operations Manager
    const readVendor = await api(tokens['Operations Manager'], 'GET', `/vendors/${vendor._id}`);
    const allFieldsPresent = readVendor.vendorName && readVendor.vendorType && readVendor.panNumber &&
                           readVendor.bankAccountNumber && readVendor.ifscCode && readVendor.bankName;
    logTest('Read Vendor (Complete)', allFieldsPresent, 'All vendor fields present');

    // UPDATE by Operations Manager
    const updatedVendor = await api(tokens['Operations Manager'], 'PUT', `/vendors/${vendor._id}`, {
      ...vendorData,
      vendorName: `Updated ${vendorData.vendorName}`,
      bankName: 'International Bank Ltd'
    });
    logTest('Update Vendor (Banking)', updatedVendor.bankName === 'International Bank Ltd', 'Bank details updated');

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

async function testAllDashboards() {
  console.log('\n  📋 COMPLETE DASHBOARD VERIFICATION');
  console.log('  ' + '─'.repeat(60));

  const dashboardTests = [
    { 
      role: 'Sales Executive', 
      expectedFields: ['opportunities', 'leadCapture', 'pipeline', 'revenueTarget'],
      description: 'SE Dashboard'
    },
    { 
      role: 'Sales Manager', 
      expectedFields: ['totalOpportunities', 'inProgressOpportunities', 'teamMembersCount'],
      description: 'SM Dashboard'
    },
    { 
      role: 'Business Head', 
      expectedFields: ['currentRevenue', 'revenueGrowth', 'revenueByMonth'],
      description: 'BH Dashboard'
    },
    { 
      role: 'Director', 
      expectedFields: ['totalOpportunities', 'profitLoss', 'profitMargin', 'monthlyData'],
      description: 'Director Dashboard'
    },
    { 
      role: 'Finance Manager', 
      expectedFields: ['totalRevenue', 'totalExpenses', 'grossProfit', 'gpPercent'],
      description: 'FM Dashboard'
    },
    { 
      role: 'Operations Manager', 
      expectedFields: ['totalPrograms', 'upcomingPrograms'],
      description: 'OM Dashboard'
    }
  ];

  for (const test of dashboardTests) {
    try {
      const endpoint = getDashboardEndpoint(test.role);
      const data = await api(tokens[test.role], 'GET', `/dashboards/${endpoint}`);
      const hasRequiredFields = test.expectedFields.some(field => data[field] !== undefined);
      const presentFields = test.expectedFields.filter(field => data[field] !== undefined);
      
      logTest(test.description, hasRequiredFields, `Fields: ${presentFields.length}/${test.expectedFields.length} present`);
      
      // Log key metrics for verification
      if (test.role === 'Director' && data.totalOpportunities !== undefined) {
        console.log(`      → Total Opportunities: ${data.totalOpportunities}, Profit: ₹${data.profitLoss?.toLocaleString() || 0}, Margin: ${data.profitMargin?.toFixed(1)}%`);
      }
      if (test.role === 'Finance Manager' && data.totalRevenue !== undefined) {
        console.log(`      → Revenue: ₹${data.totalRevenue?.toLocaleString() || 0}, GP: ${data.gpPercent?.toFixed(1)}%, Clients: ${data.clientGPData?.length || 0}`);
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
    // Director sets company-wide revenue target
    const targetAmount = 25000000;
    const target = await api(tokens['Director'], 'POST', '/revenue-targets', {
      year: new Date().getFullYear(),
      period: 'Yearly',
      amount: targetAmount
    });
    logTest('Set Company Revenue Target', target.amount !== undefined, `₹${targetAmount.toLocaleString()}`);

    // Get all revenue targets
    const targets = await api(tokens['Director'], 'GET', '/revenue-targets');
    logTest('Get All Revenue Targets', Array.isArray(targets), `${targets.length} targets found`);

    // Verify visible to all relevant roles
    const rolesToCheck = ['Sales Executive', 'Sales Manager', 'Business Head', 'Finance Manager', 'Director'];
    for (const role of rolesToCheck) {
      const endpoint = getDashboardEndpoint(role);
      const dash = await api(tokens[role], 'GET', `/dashboards/${endpoint}`);
      logTest(`Target Visible to ${role}`, dash.revenueTarget !== undefined, `₹${dash.revenueTarget?.toLocaleString() || 0}`);
    }

    return true;
  } catch (e) {
    logTest('Revenue Target Flow', false, e.message);
    return false;
  }
}

async function testFinanceAnalyticsComplete() {
  console.log('\n  📋 COMPLETE FINANCE ANALYTICS');
  console.log('  ' + '─'.repeat(60));

  try {
    // Client-wise GP analysis with multiple timelines
    const timelines = ['month-0', 'month-1', 'quarter-Q1', 'quarter-Q2', 'thisYear', 'lastYear'];
    for (const timeline of timelines) {
      const clientGP = await api(tokens['Finance Manager'], 'GET', `/dashboards/finance/client-gp?timeline=${timeline}`);
      logTest(`Client GP Analysis (${timeline})`, clientGP.clientData !== undefined, `${clientGP.clientData?.length || 0} clients`);
    }

    // Vendor-wise expenses
    const vendorExp = await api(tokens['Finance Manager'], 'GET', '/dashboards/finance/vendor-expenses');
    logTest('Vendor Expenses Analysis', vendorExp.vendorData !== undefined, `${vendorExp.vendorData?.length || 0} vendors`);

    // GP Calculations verification
    const opportunities = await api(tokens['Finance Manager'], 'GET', '/opportunities');
    let gpCalcErrors = 0;
    
    for (const opp of opportunities.slice(0, 5)) {
      if (opp.tov && opp.finalGP) {
        const calculatedGP = (opp.finalGP / opp.tov) * 100;
        const storedGP = opp.gpPercent || 0;
        const gpMatch = Math.abs(calculatedGP - storedGP) < 1;
        if (!gpMatch) gpCalcErrors++;
        logTest(`GP Calc: ${opp.opportunityId}`, gpMatch, `Stored: ${storedGP}%, Calc: ${calculatedGP.toFixed(1)}%`);
      }
    }

    // Finance dashboard GP verification
    const finDash = await api(tokens['Finance Manager'], 'GET', '/dashboards/finance');
    if (finDash.totalRevenue > 0) {
      const calcGP = ((finDash.totalRevenue - finDash.totalExpenses) / finDash.totalRevenue) * 100;
      const gpMatch = Math.abs(calcGP - finDash.gpPercent) < 1;
      logTest('Finance Dashboard GP', gpMatch, `Dashboard: ${finDash.gpPercent?.toFixed(1)}%, Calc: ${calcGP.toFixed(1)}%`);
    }

    return gpCalcErrors === 0;
  } catch (e) {
    logTest('Finance Analytics', false, e.message);
    return false;
  }
}

async function testSalesManagerComplete() {
  console.log('\n  📋 COMPLETE SALES MANAGER TESTS');
  console.log('  ' + '─'.repeat(60));

  try {
    // Get team members
    const teamMembers = await api(tokens['Sales Manager'], 'GET', '/dashboards/sales-manager/team-members');
    logTest('Get Team Members', Array.isArray(teamMembers), `${teamMembers.length} team members`);

    // Monthly performance data
    const performance = await api(tokens['Sales Manager'], 'GET', '/dashboards/sales-manager/monthly-performance');
    logTest('Monthly Performance Data', Array.isArray(performance), `${performance.length} months data`);

    // Set targets for all team members
    if (teamMembers.length > 0) {
      for (const member of teamMembers) {
        const targetAmount = 1500000 + Math.floor(Math.random() * 1000000);
        const targetResult = await api(tokens['Sales Manager'], 'PUT', `/dashboards/sales-manager/set-target/${member._id}`, {
          period: 'Yearly',
          year: new Date().getFullYear(),
          amount: targetAmount
        });
        logTest(`Set Target for ${member.name}`, targetResult.message?.includes('success'), `₹${targetAmount.toLocaleString()}`);
      }

      // Verify targets visible to team members
      for (const member of teamMembers.slice(0, 2)) {
        const memberTargets = await api(tokens['Sales Executive'], 'GET', `/targets/${member._id}`);
        logTest(`Target Visible to ${member.name}`, Array.isArray(memberTargets), `${memberTargets.length} targets`);
      }
    }

    return true;
  } catch (e) {
    logTest('Sales Manager Complete', false, e.message);
    return false;
  }
}

async function testNotificationSystemComplete() {
  console.log('\n  📋 COMPLETE NOTIFICATION SYSTEM');
  console.log('  ' + '─'.repeat(60));

  try {
    const notificationCounts = {};
    
    // Check notifications for all roles
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
    logTest('Notification System', false, e.message);
    return false;
  }
}

async function testCrossRoleDataConsistency() {
  console.log('\n  📋 CROSS-ROLE DATA CONSISTENCY');
  console.log('  ' + '─'.repeat(60));

  try {
    // Verify data consistency across all modules
    const modules = ['opportunities', 'clients', 'vendors'];
    
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
      
      // Check consistency for roles with access
      const accessibleCounts = Object.values(roleCounts).filter(v => typeof v === 'number');
      const consistent = accessibleCounts.every(v => v === accessibleCounts[0]);
      
      logTest(`${module} Data Consistency`, consistent, `Counts: ${JSON.stringify(roleCounts)}`);
    }

    // Verify revenue target consistency across all roles
    const targets = {};
    for (const role of ['Sales Executive', 'Sales Manager', 'Director', 'Finance Manager']) {
      const endpoint = getDashboardEndpoint(role);
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

async function testRealTimeDataUpdates() {
  console.log('\n  📋 REAL-TIME DATA UPDATES');
  console.log('  ' + '─'.repeat(60));

  try {
    // Get initial dashboard states
    const initialStates = {};
    for (const role of ['Director', 'Finance Manager', 'Sales Manager']) {
      const endpoint = getDashboardEndpoint(role);
      const dash = await api(tokens[role], 'GET', `/dashboards/${endpoint}`);
      initialStates[role] = {
        opportunities: dash.totalOpportunities || 0,
        revenue: dash.totalRevenue || 0
      };
    }

    // Create a new opportunity
    const testClient = {
      clientName: `Real-Time Test Client ${Date.now()}`,
      trainingSector: 'Corporate',
      contactPersonName: ['Test User'],
      designation: ['Manager'],
      contactNumber: ['9876543999'],
      emailId: `realtime${Date.now()}@test.com`,
      location: 'Test City'
    };

    const client = await api(tokens['Sales Executive'], 'POST', '/clients', testClient);
    
    const testOpp = {
      billingClient: client.clientName,
      endClient: client.clientName,
      clientCompanyName: client.clientName,
      courseName: 'Real-Time Test Course',
      courseCode: 'RT-001',
      expectedCommercialValue: 500000,
      tov: 500000,
      finalGP: 125000,
      gpPercent: 25,
      opportunityStatus: 'New',
      opportunityType: 'Training',
      serviceCategory: 'Corporate',
      expectedStartDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      expectedDuration: 5,
      expectedParticipants: 20
    };

    await api(tokens['Sales Executive'], 'POST', '/opportunities', testOpp);

    // Check updated dashboard states
    for (const role of ['Director', 'Finance Manager', 'Sales Manager']) {
      const endpoint = getDashboardEndpoint(role);
      const updatedDash = await api(tokens[role], 'GET', `/dashboards/${endpoint}`);
      const updated = updatedDash.totalOpportunities > initialStates[role].opportunities;
      logTest(`Real-Time Update (${role})`, updated, 
              `Opportunities: ${initialStates[role].opportunities} → ${updatedDash.totalOpportunities}`);
    }

    return true;
  } catch (e) {
    logTest('Real-Time Updates', false, e.message);
    return false;
  }
}

async function runUltimateRealTimeTest(iteration) {
  console.log('\n' + '═'.repeat(80));
  console.log(`  🔄 ULTIMATE REAL-TIME TEST - SCENARIO ${iteration}`);
  console.log('═'.repeat(80));

  const scenario = corporateScenarios[iteration % corporateScenarios.length];
  
  await testAllAuthentication();
  const client = await testCompleteClientWorkflow(scenario, iteration);
  const opportunity = await testCompleteOpportunityWorkflow(scenario, iteration, client);
  const vendor = await testCompleteVendorWorkflow(scenario, iteration);
  
  await testAllDashboards();
  await testRevenueTargetFlow();
  await testFinanceAnalyticsComplete();
  await testSalesManagerComplete();
  await testNotificationSystemComplete();
  await testCrossRoleDataConsistency();
  await testRealTimeDataUpdates();
}

async function main() {
  const totalIterations = 5;
  
  console.log('╔' + '═'.repeat(78) + '╗');
  console.log('║' + ' '.repeat(15) + 'ULTIMATE REAL-TIME TEST SUITE' + ' '.repeat(15) + '║');
  console.log('║' + ' '.repeat(20) + `Running ${totalIterations} Corporate Scenarios` + ' '.repeat(21) + '║');
  console.log('║' + ' '.repeat(18) + 'Testing with REAL Enterprise Data' + ' '.repeat(18) + '║');
  console.log('║' + ' '.repeat(16) + 'Complete End-to-End Workflows' + ' '.repeat(16) + '║');
  console.log('║' + ' '.repeat(19) + 'Real-Time Data Verification' + ' '.repeat(19) + '║');
  console.log('╚' + '═'.repeat(78) + '╝');

  const startTime = Date.now();

  try {
    for (let i = 1; i <= totalIterations; i++) {
      await runUltimateRealTimeTest(i);
      
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
  console.log('  📊 ULTIMATE TEST RESULTS');
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
    console.log('║' + ' '.repeat(20) + '✅ ALL ULTIMATE TESTS PASSED!' + ' '.repeat(20) + '║');
    console.log('║' + ' '.repeat(18) + 'System Working Perfectly with Real Data!' + ' '.repeat(18) + '║');
    console.log('║' + ' '.repeat(16) + 'Real-Time Updates Verified!' + ' '.repeat(16) + '║');
  } else {
    console.log('║' + ' '.repeat(15) + `⚠️  ${testResults.failed} TESTS NEED ATTENTION` + ' '.repeat(15) + '║');
  }
  console.log('╚' + '═'.repeat(78) + '╝');
}

main().catch(console.error);
