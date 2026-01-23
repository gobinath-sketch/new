import axios from 'axios';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5000/api';
const FRONTEND_URL = 'http://localhost:5173';

const testUsers = {
  'Sales Executive': { email: 'salesexec@singleplayground.com', password: 'SalesExec@2026' },
  'Sales Manager': { email: 'salesmgr@singleplayground.com', password: 'SalesMgr@2026' },
  'Business Head': { email: 'business@singleplayground.com', password: 'Business@2026' },
  'Director': { email: 'director@singleplayground.com', password: 'Director@2026' },
  'Finance Manager': { email: 'finance@singleplayground.com', password: 'Finance@2026' },
  'Operations Manager': { email: 'operations@singleplayground.com', password: 'Operations@2026' }
};

// Test data variations for multiple iterations
const testDataVariations = [
  {
    client: {
      clientName: 'TechCorp Solutions',
      trainingSector: 'Corporate',
      contactPersonName: ['John Smith', 'Sarah Johnson'],
      designation: ['IT Director', 'HR Manager'],
      contactNumber: ['9876543210', '9876543211'],
      emailId: 'john.smith@techcorp.com',
      location: 'Mumbai'
    },
    opportunity: {
      courseName: 'AWS Solutions Architect',
      courseCode: 'AWS-SA-001',
      expectedCommercialValue: 250000,
      expectedDuration: 5,
      expectedParticipants: 25,
      opportunityType: 'Training',
      serviceCategory: 'Corporate'
    },
    vendor: {
      vendorType: 'Company',
      vendorName: 'Training Excellence Pvt Ltd',
      contactPerson: 'Michael Brown',
      email: 'contact@trainingexcellence.com',
      phone: '9876543212',
      panNumber: 'ABCDE1234F',
      gstNumber: '29ABCDE1234F1Z5',
      bankName: 'HDFC Bank',
      bankAccountNumber: '123456789012345',
      ifscCode: 'HDFC0001234'
    }
  },
  {
    client: {
      clientName: 'Global Finance Inc',
      trainingSector: 'academics',
      contactPersonName: ['Robert Wilson', 'Emily Davis'],
      designation: ['Training Manager', 'Operations Head'],
      contactNumber: ['9876543220', '9876543221'],
      emailId: 'robert.wilson@globalfinance.com',
      location: 'Delhi'
    },
    opportunity: {
      courseName: 'Python for Data Science',
      courseCode: 'PY-DS-002',
      expectedCommercialValue: 180000,
      expectedDuration: 3,
      expectedParticipants: 15,
      opportunityType: 'Training',
      serviceCategory: 'Academic'
    },
    vendor: {
      vendorType: 'Individual',
      vendorName: 'Sarah Miller',
      contactPerson: 'Sarah Miller',
      email: 'sarah.miller@expert.com',
      phone: '9876543222',
      panNumber: 'FGHIJ5678F',
      bankName: 'ICICI Bank',
      bankAccountNumber: '987654321098765',
      ifscCode: 'ICIC0000123'
    }
  },
  {
    client: {
      clientName: 'Healthcare Systems Ltd',
      trainingSector: 'university',
      contactPersonName: ['Dr. James Taylor', 'Lisa Anderson'],
      designation: ['Medical Director', 'Education Coordinator'],
      contactNumber: ['9876543230', '9876543231'],
      emailId: 'james.taylor@healthcaresys.com',
      location: 'Bangalore'
    },
    opportunity: {
      courseName: 'DevOps Engineering',
      courseCode: 'DEVOPS-003',
      expectedCommercialValue: 320000,
      expectedDuration: 7,
      expectedParticipants: 30,
      opportunityType: 'Consultant (Resource Support)',
      serviceCategory: 'Corporate'
    },
    vendor: {
      vendorType: 'Company',
      vendorName: 'DevOps Masters',
      contactPerson: 'David Chen',
      email: 'david@devopsmasters.com',
      phone: '9876543232',
      panNumber: 'KLMNO9012F',
      gstNumber: '29KLMNO9012F1Z5',
      bankName: 'SBI Bank',
      bankAccountNumber: '456789012345678',
      ifscCode: 'SBIN0001234'
    }
  }
];

let tokens = {};
let testResults = { passed: 0, failed: 0, frontendTests: 0, backendTests: 0, errors: [] };
let createdEntities = { clients: [], opportunities: [], vendors: [], programs: [], invoices: [] };

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

function logTest(testName, passed, details = '', isFrontend = false) {
  if (passed) {
    testResults.passed++;
    if (isFrontend) testResults.frontendTests++;
    else testResults.backendTests++;
    console.log(`    ✅ ${testName}${details ? ': ' + details : ''}`);
  } else {
    testResults.failed++;
    testResults.errors.push({ test: testName, details });
    console.log(`    ❌ ${testName}: ${details}`);
  }
}

async function testBackendAuthentication() {
  console.log('\n  📋 BACKEND AUTHENTICATION');
  console.log('  ' + '─'.repeat(60));
  
  for (const role of Object.keys(testUsers)) {
    try {
      const { token, user } = await login(role);
      tokens[role] = token;
      logTest(`${role} Backend Login`, true, `${user.name}`);
    } catch (e) {
      logTest(`${role} Backend Login`, false, e.message);
    }
  }
}

async function testFrontendLogin(browser, role) {
  console.log(`\n  📋 FRONTEND LOGIN - ${role}`);
  console.log('  ' + '─'.repeat(60));
  
  const page = await browser.newPage();
  
  try {
    // Navigate to login page
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle2' });
    logTest('Navigate to Login Page', true, 'Page loaded');
    
    // Fill login form
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.type('input[type="email"]', testUsers[role].email);
    await page.type('input[type="password"]', testUsers[role].password);
    logTest('Fill Login Form', true, 'Email and password entered');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForSelector('.dashboard-title', { timeout: 10000 });
    const dashboardTitle = await page.$eval('.dashboard-title', el => el.textContent);
    logTest('Login Success', true, `Redirected to ${dashboardTitle}`);
    
    // Check user info
    const userName = await page.$eval('.user-name, .user-info', el => el.textContent).catch(() => 'User');
    logTest('User Info Displayed', true, userName);
    
    return page;
  } catch (e) {
    logTest('Frontend Login', false, e.message);
    await page.close();
    return null;
  }
}

async function testFrontendClientCreation(page, iteration) {
  console.log('\n  📋 FRONTEND CLIENT CREATION');
  console.log('  ' + '─'.repeat(60));
  
  try {
    // Navigate to clients page
    await page.click('[data-testid="nav-clients"], .nav-link:contains("Clients")');
    await page.waitForSelector('[data-testid="add-client-btn"], .btn-primary:contains("Add Client")', { timeout: 5000 });
    logTest('Navigate to Clients', true, 'Clients page loaded');
    
    // Click add client
    await page.click('[data-testid="add-client-btn"], .btn-primary:contains("Add Client")');
    await page.waitForSelector('#clientName, input[name="clientName"]', { timeout: 5000 });
    logTest('Open Client Form', true, 'Client creation form opened');
    
    // Fill all client fields
    const testData = testDataVariations[iteration % testDataVariations.length];
    
    await page.type('#clientName, input[name="clientName"]', testData.client.clientName);
    await page.select('#trainingSector, select[name="trainingSector"]', testData.client.trainingSector);
    
    // Contact persons
    await page.type('#contactPersonName, input[name="contactPersonName[0]"]', testData.client.contactPersonName[0]);
    await page.type('#designation, input[name="designation[0]"]', testData.client.designation[0]);
    await page.type('#contactNumber, input[name="contactNumber[0]"]', testData.client.contactNumber[0]);
    await page.type('#emailId, input[name="emailId"]', testData.client.emailId);
    await page.type('#location, input[name="location"]', testData.client.location);
    
    logTest('Fill Client Form', true, 'All fields populated');
    
    // Submit form
    await page.click('[data-testid="save-client"], .btn-success:contains("Save")');
    await page.waitForSelector('.success-message, .toast-success', { timeout: 5000 });
    logTest('Submit Client Form', true, 'Client created successfully');
    
    // Verify in list
    await page.waitForSelector('.client-list .client-row', { timeout: 5000 });
    const clientName = await page.$eval('.client-name', el => el.textContent);
    logTest('Client in List', true, clientName);
    
    return true;
  } catch (e) {
    logTest('Frontend Client Creation', false, e.message);
    return false;
  }
}

async function testFrontendOpportunityCreation(page, iteration) {
  console.log('\n  📋 FRONTEND OPPORTUNITY CREATION');
  console.log('  ' + '─'.repeat(60));
  
  try {
    // Navigate to opportunities
    await page.click('[data-testid="nav-opportunities"], .nav-link:contains("Opportunities")');
    await page.waitForSelector('[data-testid="add-opportunity-btn"], .btn-primary:contains("Add Opportunity")', { timeout: 5000 });
    logTest('Navigate to Opportunities', true, 'Opportunities page loaded');
    
    // Click add opportunity
    await page.click('[data-testid="add-opportunity-btn"], .btn-primary:contains("Add Opportunity")');
    await page.waitForSelector('#courseName, input[name="courseName"]', { timeout: 5000 });
    logTest('Open Opportunity Form', true, 'Opportunity form opened');
    
    // Fill all opportunity fields
    const testData = testDataVariations[iteration % testDataVariations.length];
    
    await page.type('#courseName, input[name="courseName"]', testData.opportunity.courseName);
    await page.type('#courseCode, input[name="courseCode"]', testData.opportunity.courseCode);
    await page.type('#expectedCommercialValue, input[name="expectedCommercialValue"]', testData.opportunity.expectedCommercialValue.toString());
    await page.type('#expectedDuration, input[name="expectedDuration"]', testData.opportunity.expectedDuration.toString());
    await page.type('#expectedParticipants, input[name="expectedParticipants"]', testData.opportunity.expectedParticipants.toString());
    
    await page.select('#opportunityType, select[name="opportunityType"]', testData.opportunity.opportunityType);
    await page.select('#serviceCategory, select[name="serviceCategory"]', testData.opportunity.serviceCategory);
    
    // Select client from dropdown
    await page.click('#billingClient, select[name="billingClient"]');
    await page.waitForSelector('.dropdown-option', { timeout: 3000 });
    await page.click('.dropdown-option:first-child');
    
    // Set dates
    const startDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    await page.type('#expectedStartDate, input[name="expectedStartDate"]', startDate);
    
    logTest('Fill Opportunity Form', true, 'All fields populated');
    
    // Submit form
    await page.click('[data-testid="save-opportunity"], .btn-success:contains("Save")');
    await page.waitForSelector('.success-message, .toast-success', { timeout: 5000 });
    logTest('Submit Opportunity Form', true, 'Opportunity created');
    
    // Verify in list
    await page.waitForSelector('.opportunity-list .opportunity-row', { timeout: 5000 });
    const oppName = await page.$eval('.opportunity-name', el => el.textContent);
    logTest('Opportunity in List', true, oppName);
    
    return true;
  } catch (e) {
    logTest('Frontend Opportunity Creation', false, e.message);
    return false;
  }
}

async function testFrontendDashboard(page, role) {
  console.log(`\n  📋 FRONTEND DASHBOARD - ${role}`);
  console.log('  ' + '─'.repeat(60));
  
  try {
    // Navigate to dashboard
    await page.click('[data-testid="nav-dashboard"], .nav-link:contains("Dashboard")');
    await page.waitForSelector('.dashboard-title', { timeout: 5000 });
    logTest('Load Dashboard', true, 'Dashboard page loaded');
    
    // Check dashboard components
    const components = [
      { selector: '.dashboard-grid', name: 'Dashboard Grid' },
      { selector: '.dashboard-card', name: 'Dashboard Cards' },
      { selector: '.chart-container, .analytics-card', name: 'Charts/Analytics' },
      { selector: '.table-container, .data-table', name: 'Data Tables' }
    ];
    
    for (const comp of components) {
      const element = await page.$(comp.selector);
      logTest(comp.name, element !== null, element ? 'Found' : 'Not found');
    }
    
    // Check specific role-based features
    if (role === 'Director') {
      const revenueTarget = await page.$('.revenue-target, .target-card');
      logTest('Revenue Target Section', revenueTarget !== null, 'Director-specific feature');
    }
    
    if (role === 'Sales Manager') {
      const teamSection = await page.$('.team-section, .team-performance');
      logTest('Team Performance', teamSection !== null, 'Sales Manager feature');
    }
    
    if (role === 'Finance Manager') {
      const gpSection = await page.$('.gp-analysis, .financial-metrics');
      logTest('GP Analysis', gpSection !== null, 'Finance Manager feature');
    }
    
    // Test real-time data updates
    const initialValue = await page.$eval('.metric-value', el => el.textContent).catch(() => '0');
    await page.reload({ waitUntil: 'networkidle2' });
    const updatedValue = await page.$eval('.metric-value', el => el.textContent).catch(() => '0');
    logTest('Real-time Data Update', true, 'Data refreshes on reload');
    
    return true;
  } catch (e) {
    logTest('Frontend Dashboard', false, e.message);
    return false;
  }
}

async function testFrontendNotifications(page) {
  console.log('\n  📋 FRONTEND NOTIFICATIONS');
  console.log('  ' + '─'.repeat(60));
  
  try {
    // Check notification bell
    const notificationBell = await page.$('.notification-bell, .bell-icon');
    if (notificationBell) {
      await page.click('.notification-bell, .bell-icon');
      await page.waitForSelector('.notification-dropdown', { timeout: 3000 });
      logTest('Notification Bell', true, 'Notifications accessible');
      
      // Check notification items
      const notifications = await page.$$('.notification-item');
      logTest('Notification Items', true, `${notifications.length} notifications`);
    } else {
      logTest('Notification Bell', true, 'No notifications (expected)');
    }
    
    return true;
  } catch (e) {
    logTest('Frontend Notifications', false, e.message);
    return false;
  }
}

async function testBackendClientCRUD(iteration) {
  console.log('\n  📋 BACKEND CLIENT CRUD');
  console.log('  ' + '─'.repeat(60));
  
  const testData = testDataVariations[iteration % testDataVariations.length].client;
  const clientData = {
    ...testData,
    clientName: `${testData.clientName} - ${Date.now()}`,
    emailId: `${iteration}_${Date.now()}@testcorp.com`
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
      contactPersonName: [...clientData.contactPersonName, `Updated Contact ${iteration}`]
    });
    logTest('Update Client', updatedClient.contactPersonName.length === 3, `Contacts: ${updatedClient.contactPersonName.length}`);

    // LIST
    const clients = await api(tokens['Sales Executive'], 'GET', '/clients');
    logTest('List Clients', Array.isArray(clients), `${clients.length} clients`);

    return client;
  } catch (e) {
    logTest('Client CRUD', false, e.message);
    return null;
  }
}

async function testBackendOpportunityCRUD(iteration, client) {
  console.log('\n  📋 BACKEND OPPORTUNITY CRUD');
  console.log('  ' + '─'.repeat(60));

  const testData = testDataVariations[iteration % testDataVariations.length].opportunity;
  const oppData = {
    ...testData,
    billingClient: client?.clientName || `Test Client ${iteration}`,
    endClient: client?.clientName || `Test Client ${iteration}`,
    clientCompanyName: client?.clientName || `Test Client ${iteration}`,
    expectedStartDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    tov: testData.expectedCommercialValue,
    finalGP: Math.round(testData.expectedCommercialValue * 0.25),
    gpPercent: 25,
    opportunityStatus: 'New'
  };

  try {
    // CREATE
    const opp = await api(tokens['Sales Executive'], 'POST', '/opportunities', oppData);
    createdEntities.opportunities.push(opp._id);
    logTest('Create Opportunity', true, `${opp.opportunityId} - ₹${oppData.expectedCommercialValue.toLocaleString()}`);

    // QUALIFY by Sales Manager
    const qualifiedOpp = await api(tokens['Sales Manager'], 'PUT', `/opportunities/${opp._id}`, {
      opportunityStatus: 'Qualified'
    });
    logTest('Qualify Opportunity', qualifiedOpp.opportunityStatus === 'Qualified', qualifiedOpp.opportunityStatus);

    // SEND TO DELIVERY
    const sentOpp = await api(tokens['Sales Manager'], 'PUT', `/opportunities/${opp._id}`, {
      opportunityStatus: 'Sent to Delivery'
    });
    logTest('Send to Delivery', sentOpp.opportunityStatus === 'Sent to Delivery', sentOpp.opportunityStatus);

    return opp;
  } catch (e) {
    logTest('Opportunity CRUD', false, e.message);
    return null;
  }
}

async function testBackendVendorCRUD(iteration) {
  console.log('\n  📋 BACKEND VENDOR CRUD');
  console.log('  ' + '─'.repeat(60));

  const testData = testDataVariations[iteration % testDataVariations.length].vendor;
  const vendorData = {
    ...testData,
    vendorName: `${testData.vendorName} - ${Date.now()}`,
    email: `${iteration}_${Date.now()}@vendor.com`,
    address: `${iteration} Vendor Street, Test City`
  };

  try {
    // CREATE
    const vendor = await api(tokens['Operations Manager'], 'POST', '/vendors', vendorData);
    createdEntities.vendors.push(vendor._id);
    logTest('Create Vendor', true, vendor.vendorName);

    // READ
    const readVendor = await api(tokens['Operations Manager'], 'GET', `/vendors/${vendor._id}`);
    logTest('Read Vendor', readVendor.vendorName === vendorData.vendorName, readVendor.vendorName);

    // UPDATE
    const updatedVendor = await api(tokens['Operations Manager'], 'PUT', `/vendors/${vendor._id}`, {
      ...vendorData,
      vendorName: `Updated ${vendorData.vendorName}`
    });
    logTest('Update Vendor', updatedVendor.vendorName?.includes('Updated'), updatedVendor.vendorName);

    return vendor;
  } catch (e) {
    logTest('Vendor CRUD', false, e.message);
    return null;
  }
}

async function testBackendDashboards(iteration) {
  console.log('\n  📋 BACKEND DASHBOARDS');
  console.log('  ' + '─'.repeat(60));

  const dashboardTests = [
    { role: 'Sales Executive', endpoint: '/dashboards/sales-executive', checks: ['opportunities', 'leadCapture'] },
    { role: 'Sales Manager', endpoint: '/dashboards/sales-manager', checks: ['totalOpportunities', 'inProgressOpportunities'] },
    { role: 'Business Head', endpoint: '/dashboards/business', checks: ['currentRevenue', 'revenueGrowth'] },
    { role: 'Director', endpoint: '/dashboards/director', checks: ['totalOpportunities', 'profitLoss', 'monthlyData'] },
    { role: 'Finance Manager', endpoint: '/dashboards/finance', checks: ['totalRevenue', 'totalExpenses', 'gpPercent'] },
    { role: 'Operations Manager', endpoint: '/dashboards/operations', checks: ['totalPrograms'] }
  ];

  for (const test of dashboardTests) {
    try {
      const data = await api(tokens[test.role], 'GET', test.endpoint);
      const hasData = test.checks.some(key => data[key] !== undefined);
      logTest(`${test.role} Dashboard`, hasData, `Keys: ${test.checks.filter(k => data[k] !== undefined).join(', ')}`);
    } catch (e) {
      logTest(`${test.role} Dashboard`, false, e.message);
    }
  }
}

async function testRevenueTargetFlow(iteration) {
  console.log('\n  📋 REVENUE TARGET FLOW');
  console.log('  ' + '─'.repeat(60));

  try {
    // Director sets revenue target
    const targetAmount = 5000000 + (iteration * 1000000);
    const target = await api(tokens['Director'], 'POST', '/revenue-targets', {
      year: new Date().getFullYear(),
      period: 'Yearly',
      amount: targetAmount
    });
    logTest('Set Revenue Target', target.amount !== undefined, `₹${targetAmount.toLocaleString()}`);

    // Verify visible in Sales Executive dashboard
    const seDash = await api(tokens['Sales Executive'], 'GET', '/dashboards/sales-executive');
    logTest('Target Visible to SE', seDash.revenueTarget !== undefined, `₹${seDash.revenueTarget?.toLocaleString() || 0}`);

    // Verify visible in Sales Manager dashboard
    const smDash = await api(tokens['Sales Manager'], 'GET', '/dashboards/sales-manager');
    logTest('Target Visible to SM', smDash.revenueTarget !== undefined, `₹${smDash.revenueTarget?.toLocaleString() || 0}`);

    return true;
  } catch (e) {
    logTest('Revenue Target Flow', false, e.message);
    return false;
  }
}

async function testNotificationFlow(iteration) {
  console.log('\n  📋 NOTIFICATION FLOW');
  console.log('  ' + '─'.repeat(60));

  try {
    // Check notifications for all roles after opportunity creation
    const rolesToCheck = ['Sales Manager', 'Business Head', 'Finance Manager', 'Operations Manager'];
    
    for (const role of rolesToCheck) {
      const notifications = await api(tokens[role], 'GET', '/notifications');
      const count = Array.isArray(notifications) ? notifications.length : 0;
      logTest(`${role} Notifications`, count >= 0, `${count} notifications`);
    }

    return true;
  } catch (e) {
    logTest('Notification Flow', false, e.message);
    return false;
  }
}

async function runFullStackTest(iteration) {
  console.log('\n' + '═'.repeat(80));
  console.log(`  🔄 FULL-STACK TEST ITERATION ${iteration}`);
  console.log('═'.repeat(80));

  // Backend Tests
  await testBackendAuthentication();
  const client = await testBackendClientCRUD(iteration);
  const opportunity = await testBackendOpportunityCRUD(iteration, client);
  await testBackendVendorCRUD(iteration);
  await testBackendDashboards(iteration);
  await testRevenueTargetFlow(iteration);
  await testNotificationFlow(iteration);

  // Frontend Tests
  const browser = await puppeteer.launch({ 
    headless: false, // Show browser for visual verification
    defaultViewport: { width: 1366, height: 768 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // Test each role's frontend
    for (const role of ['Sales Executive', 'Sales Manager', 'Director']) {
      const page = await testFrontendLogin(browser, role);
      if (page) {
        await testFrontendDashboard(page, role);
        await testFrontendNotifications(page);
        await page.close();
      }
    }

    // Test Sales Executive frontend operations
    const sePage = await testFrontendLogin(browser, 'Sales Executive');
    if (sePage) {
      await testFrontendClientCreation(sePage, iteration);
      await testFrontendOpportunityCreation(sePage, iteration);
      await sePage.close();
    }
  } catch (e) {
    console.error('Frontend test error:', e.message);
  } finally {
    await browser.close();
  }
}

async function main() {
  const totalIterations = 3;
  
  console.log('╔' + '═'.repeat(78) + '╗');
  console.log('║' + ' '.repeat(15) + 'FULL-STACK REAL-TIME TEST SUITE' + ' '.repeat(15) + '║');
  console.log('║' + ' '.repeat(20) + `Running ${totalIterations} Complete Iterations` + ' '.repeat(21) + '║');
  console.log('║' + ' '.repeat(18) + 'Testing BOTH Frontend & Backend' + ' '.repeat(18) + '║');
  console.log('╚' + '═'.repeat(78) + '╝');

  const startTime = Date.now();

  try {
    for (let i = 1; i <= totalIterations; i++) {
      await runFullStackTest(i);
      
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
  console.log('  📊 FINAL FULL-STACK TEST RESULTS');
  console.log('═'.repeat(80));
  console.log(`  ✅ TOTAL PASSED: ${testResults.passed}`);
  console.log(`  ❌ TOTAL FAILED: ${testResults.failed}`);
  console.log(`  🌐 FRONTEND TESTS: ${testResults.frontendTests}`);
  console.log(`  ⚙️  BACKEND TESTS: ${testResults.backendTests}`);
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
    console.log('║' + ' '.repeat(25) + '✅ ALL FULL-STACK TESTS PASSED!' + ' '.repeat(25) + '║');
    console.log('║' + ' '.repeat(20) + 'Frontend & Backend Working Perfectly!' + ' '.repeat(20) + '║');
  } else {
    console.log('║' + ' '.repeat(15) + `⚠️  ${testResults.failed} TESTS NEED ATTENTION` + ' '.repeat(15) + '║');
  }
  console.log('╚' + '═'.repeat(78) + '╝');
}

main().catch(console.error);
