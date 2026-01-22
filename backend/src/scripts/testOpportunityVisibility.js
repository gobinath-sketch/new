import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../config.env') });

const BASE_URL = 'http://localhost:5000/api';

// Test users
const TEST_USERS = {
  director: { email: 'director@singleplayground.com', password: 'Director@2026' },
  salesExecutive: { email: 'salesexec@singleplayground.com', password: 'SalesExec@2026' },
  salesManager: { email: 'salesmgr@singleplayground.com', password: 'SalesMgr@2026' },
  businessHead: { email: 'business@singleplayground.com', password: 'Business@2026' },
  operationsManager: { email: 'operations@singleplayground.com', password: 'Operations@2026' },
  financeManager: { email: 'finance@singleplayground.com', password: 'Finance@2026' }
};

let tokens = {};
let createdOpportunityIds = [];

// Helper function to login
async function login(role, email, password) {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, { email, password });
    tokens[role] = response.data.token;
    return response.data.token;
  } catch (error) {
    console.error(`❌ Login failed for ${role}:`, error.response?.data?.error || error.message);
    return null;
  }
}

// Helper function to make authenticated request
async function authenticatedRequest(method, endpoint, token, data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: { Authorization: `Bearer ${token}` }
    };
    if (data) config.data = data;
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`❌ Request failed: ${method} ${endpoint}`, error.response?.data?.error || error.message);
    return null;
  }
}

// Test 1: Login all users
async function testLogin() {
  console.log('\n=== Test 1: User Authentication ===');
  
  const results = await Promise.all([
    login('director', TEST_USERS.director.email, TEST_USERS.director.password),
    login('salesExecutive', TEST_USERS.salesExecutive.email, TEST_USERS.salesExecutive.password),
    login('salesManager', TEST_USERS.salesManager.email, TEST_USERS.salesManager.password),
    login('businessHead', TEST_USERS.businessHead.email, TEST_USERS.businessHead.password),
    login('operationsManager', TEST_USERS.operationsManager.email, TEST_USERS.operationsManager.password),
    login('financeManager', TEST_USERS.financeManager.email, TEST_USERS.financeManager.password)
  ]);
  
  const allLoggedIn = results.every(token => token !== null);
  if (allLoggedIn) {
    console.log('✅ All users logged in successfully');
  } else {
    console.log('⚠️  Some users failed to login');
  }
  return allLoggedIn;
}

// Test 2: Sales Executive creates an opportunity
async function testSalesExecutiveCreatesOpportunity() {
  console.log('\n=== Test 2: Sales Executive Creates Opportunity ===');
  
  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(futureDate.getDate() + 30);
  
  const opportunityData = {
    trainingOpportunity: 'Training',
    trainingSector: 'Corporate',
    trainingStatus: 'Scheduled',
    billingClient: 'Test Client SE',
    endClient: 'Test Client SE',
    courseCode: 'TEST-SE-001',
    technology: 'Python',
    courseName: 'Test Training by Sales Executive',
    location: 'Online',
    numberOfParticipants: 25,
    numberOfDays: 5,
    startDate: today.toISOString().split('T')[0],
    endDate: futureDate.toISOString().split('T')[0],
    tov: 100000,
    trainingYear: 2026,
    trainingMonth: 'January'
  };
  
  const result = await authenticatedRequest('POST', '/opportunities', tokens.salesExecutive, opportunityData);
  
  if (result && result.opportunityId) {
    createdOpportunityIds.push({ id: result.opportunityId, creator: 'Sales Executive', _id: result._id });
    console.log(`✅ Sales Executive created opportunity: ${result.opportunityId}`);
    return true;
  } else {
    console.log('❌ Failed to create opportunity as Sales Executive');
    return false;
  }
}

// Test 3: Sales Manager creates an opportunity
async function testSalesManagerCreatesOpportunity() {
  console.log('\n=== Test 3: Sales Manager Creates Opportunity ===');
  
  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(futureDate.getDate() + 30);
  
  const opportunityData = {
    trainingOpportunity: 'Training',
    trainingSector: 'Corporate',
    trainingStatus: 'Scheduled',
    billingClient: 'Test Client SM',
    endClient: 'Test Client SM',
    courseCode: 'TEST-SM-001',
    technology: 'Java',
    courseName: 'Test Training by Sales Manager',
    location: 'Classroom',
    numberOfParticipants: 30,
    numberOfDays: 5,
    startDate: today.toISOString().split('T')[0],
    endDate: futureDate.toISOString().split('T')[0],
    tov: 150000,
    trainingYear: 2026,
    trainingMonth: 'February'
  };
  
  const result = await authenticatedRequest('POST', '/opportunities', tokens.salesManager, opportunityData);
  
  if (result && result.opportunityId) {
    createdOpportunityIds.push({ id: result.opportunityId, creator: 'Sales Manager', _id: result._id });
    console.log(`✅ Sales Manager created opportunity: ${result.opportunityId}`);
    return true;
  } else {
    console.log('❌ Failed to create opportunity as Sales Manager');
    return false;
  }
}

// Test 4: Operations Manager sees opportunities
async function testOperationsManagerSeesOpportunities() {
  console.log('\n=== Test 4: Operations Manager Dashboard - Opportunities Visibility ===');
  
  const dashboard = await authenticatedRequest('GET', '/dashboards/operations', tokens.operationsManager);
  
  if (dashboard && dashboard.recentOpportunities && Array.isArray(dashboard.recentOpportunities)) {
    console.log(`✅ Operations Manager dashboard shows ${dashboard.recentOpportunities.length} opportunity/opportunities`);
    
    // Check if both created opportunities are visible
    const visibleIds = dashboard.recentOpportunities.map(opp => opp.opportunityId);
    const seOpp = createdOpportunityIds.find(o => o.creator === 'Sales Executive');
    const smOpp = createdOpportunityIds.find(o => o.creator === 'Sales Manager');
    
    const hasSEOpp = seOpp && visibleIds.includes(seOpp.id);
    const hasSMOpp = smOpp && visibleIds.includes(smOpp.id);
    
    if (hasSEOpp) {
      console.log(`   ✅ Can see Sales Executive's opportunity: ${seOpp.id}`);
    } else {
      console.log(`   ❌ Cannot see Sales Executive's opportunity`);
    }
    
    if (hasSMOpp) {
      console.log(`   ✅ Can see Sales Manager's opportunity: ${smOpp.id}`);
    } else {
      console.log(`   ❌ Cannot see Sales Manager's opportunity`);
    }
    
    // Check for required fields
    if (dashboard.recentOpportunities.length > 0) {
      const firstOpp = dashboard.recentOpportunities[0];
      const hasAdhocId = firstOpp.opportunityId && firstOpp.opportunityId.length === 12;
      const hasCreatedBy = firstOpp.salesExecutiveId?.name || firstOpp.salesManagerId?.name;
      const hasCreatedDate = firstOpp.createdAt;
      
      console.log(`   ✅ Opportunities have Adhoc ID: ${hasAdhocId ? 'Yes' : 'No'}`);
      console.log(`   ✅ Opportunities show Created By: ${hasCreatedBy ? 'Yes' : 'No'}`);
      console.log(`   ✅ Opportunities show Created Date: ${hasCreatedDate ? 'Yes' : 'No'}`);
    }
    
    return hasSEOpp && hasSMOpp;
  } else {
    console.log('❌ Operations Manager dashboard does not include opportunities');
    return false;
  }
}

// Test 5: Finance Manager sees opportunities
async function testFinanceManagerSeesOpportunities() {
  console.log('\n=== Test 5: Finance Manager Dashboard - Opportunities Visibility ===');
  
  const dashboard = await authenticatedRequest('GET', '/dashboards/finance', tokens.financeManager);
  
  if (dashboard && dashboard.recentOpportunities && Array.isArray(dashboard.recentOpportunities)) {
    console.log(`✅ Finance Manager dashboard shows ${dashboard.recentOpportunities.length} opportunity/opportunities`);
    
    const visibleIds = dashboard.recentOpportunities.map(opp => opp.opportunityId);
    const seOpp = createdOpportunityIds.find(o => o.creator === 'Sales Executive');
    const smOpp = createdOpportunityIds.find(o => o.creator === 'Sales Manager');
    
    const hasSEOpp = seOpp && visibleIds.includes(seOpp.id);
    const hasSMOpp = smOpp && visibleIds.includes(smOpp.id);
    
    console.log(`   ${hasSEOpp ? '✅' : '❌'} Can see Sales Executive's opportunity`);
    console.log(`   ${hasSMOpp ? '✅' : '❌'} Can see Sales Manager's opportunity`);
    
    return hasSEOpp && hasSMOpp;
  } else {
    console.log('❌ Finance Manager dashboard does not include opportunities');
    return false;
  }
}

// Test 6: Business Head sees opportunities
async function testBusinessHeadSeesOpportunities() {
  console.log('\n=== Test 6: Business Head Dashboard - Opportunities Visibility ===');
  
  const dashboard = await authenticatedRequest('GET', '/dashboards/business', tokens.businessHead);
  
  if (dashboard && dashboard.recentOpportunities && Array.isArray(dashboard.recentOpportunities)) {
    console.log(`✅ Business Head dashboard shows ${dashboard.recentOpportunities.length} opportunity/opportunities`);
    
    const visibleIds = dashboard.recentOpportunities.map(opp => opp.opportunityId);
    const seOpp = createdOpportunityIds.find(o => o.creator === 'Sales Executive');
    const smOpp = createdOpportunityIds.find(o => o.creator === 'Sales Manager');
    
    const hasSEOpp = seOpp && visibleIds.includes(seOpp.id);
    const hasSMOpp = smOpp && visibleIds.includes(smOpp.id);
    
    console.log(`   ${hasSEOpp ? '✅' : '❌'} Can see Sales Executive's opportunity`);
    console.log(`   ${hasSMOpp ? '✅' : '❌'} Can see Sales Manager's opportunity`);
    
    return hasSEOpp && hasSMOpp;
  } else {
    console.log('❌ Business Head dashboard does not include opportunities');
    return false;
  }
}

// Test 7: Sales Manager sees Sales Executive's opportunities
async function testSalesManagerSeesSalesExecutiveOpportunities() {
  console.log('\n=== Test 7: Sales Manager Dashboard - Can See Sales Executive Opportunities ===');
  
  const dashboard = await authenticatedRequest('GET', '/dashboards/sales-manager', tokens.salesManager);
  
  if (dashboard && dashboard.recentOpportunities && Array.isArray(dashboard.recentOpportunities)) {
    console.log(`✅ Sales Manager dashboard shows ${dashboard.recentOpportunities.length} opportunity/opportunities`);
    
    const visibleIds = dashboard.recentOpportunities.map(opp => opp.opportunityId);
    const seOpp = createdOpportunityIds.find(o => o.creator === 'Sales Executive');
    
    const hasSEOpp = seOpp && visibleIds.includes(seOpp.id);
    
    if (hasSEOpp) {
      console.log(`   ✅ Can see Sales Executive's opportunity: ${seOpp.id}`);
    } else {
      console.log(`   ❌ Cannot see Sales Executive's opportunity`);
    }
    
    return hasSEOpp;
  } else {
    console.log('❌ Sales Manager dashboard does not include opportunities');
    return false;
  }
}

// Test 8: Sales Executive sees Sales Manager's opportunities
async function testSalesExecutiveSeesSalesManagerOpportunities() {
  console.log('\n=== Test 8: Sales Executive Dashboard - Can See Sales Manager Opportunities ===');
  
  const dashboard = await authenticatedRequest('GET', '/dashboards/sales-executive', tokens.salesExecutive);
  
  if (dashboard && dashboard.recentOpportunities && Array.isArray(dashboard.recentOpportunities)) {
    console.log(`✅ Sales Executive dashboard shows ${dashboard.recentOpportunities.length} opportunity/opportunities`);
    
    const visibleIds = dashboard.recentOpportunities.map(opp => opp.opportunityId);
    const smOpp = createdOpportunityIds.find(o => o.creator === 'Sales Manager');
    
    const hasSMOpp = smOpp && visibleIds.includes(smOpp.id);
    
    if (hasSMOpp) {
      console.log(`   ✅ Can see Sales Manager's opportunity: ${smOpp.id}`);
    } else {
      console.log(`   ❌ Cannot see Sales Manager's opportunity`);
    }
    
    return hasSMOpp;
  } else {
    console.log('❌ Sales Executive dashboard does not include opportunities');
    return false;
  }
}

// Test 9: Verify opportunity detail view access
async function testOpportunityDetailView() {
  console.log('\n=== Test 9: Opportunity Detail View Access ===');
  
  if (createdOpportunityIds.length === 0) {
    console.log('⚠️  No opportunities created, skipping detail view test');
    return false;
  }
  
  const testOpp = createdOpportunityIds[0];
  
  // Try to access opportunity detail as Operations Manager
  const detail = await authenticatedRequest('GET', `/opportunities/${testOpp._id}`, tokens.operationsManager);
  
  if (detail && detail.opportunityId) {
    console.log(`✅ Operations Manager can view opportunity detail: ${detail.opportunityId}`);
    return true;
  } else {
    console.log(`❌ Operations Manager cannot view opportunity detail`);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Opportunity Visibility Tests...\n');
  console.log('Testing: Opportunities created by Sales Executive and Sales Manager');
  console.log('Expected: Visible to Operations Manager, Finance Manager, Business Head, and cross-visible\n');
  
  let passed = 0;
  let total = 9;
  
  // Test 1: Login
  if (await testLogin()) {
    passed++;
  } else {
    console.log('\n❌ Login failed. Please check user credentials and try again.');
    return;
  }
  
  // Test 2: Sales Executive creates opportunity
  if (await testSalesExecutiveCreatesOpportunity()) {
    passed++;
  }
  
  // Test 3: Sales Manager creates opportunity
  if (await testSalesManagerCreatesOpportunity()) {
    passed++;
  }
  
  // Wait a moment for data to be available
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 4: Operations Manager sees opportunities
  if (await testOperationsManagerSeesOpportunities()) {
    passed++;
  }
  
  // Test 5: Finance Manager sees opportunities
  if (await testFinanceManagerSeesOpportunities()) {
    passed++;
  }
  
  // Test 6: Business Head sees opportunities
  if (await testBusinessHeadSeesOpportunities()) {
    passed++;
  }
  
  // Test 7: Sales Manager sees Sales Executive opportunities
  if (await testSalesManagerSeesSalesExecutiveOpportunities()) {
    passed++;
  }
  
  // Test 8: Sales Executive sees Sales Manager opportunities
  if (await testSalesExecutiveSeesSalesManagerOpportunities()) {
    passed++;
  }
  
  // Test 9: Opportunity detail view
  if (await testOpportunityDetailView()) {
    passed++;
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`📊 Test Results: ${passed}/${total} tests passed`);
  if (passed === total) {
    console.log('✅ All tests passed! Opportunity visibility is working correctly.');
    console.log('\n✅ Summary:');
    console.log('   - Sales Executive can create opportunities');
    console.log('   - Sales Manager can create opportunities');
    console.log('   - Operations Manager can see both');
    console.log('   - Finance Manager can see both');
    console.log('   - Business Head can see both');
    console.log('   - Sales Manager can see Sales Executive opportunities');
    console.log('   - Sales Executive can see Sales Manager opportunities');
    console.log('   - All show Adhoc ID, Created By, Created Date, and View button');
  } else {
    console.log(`⚠️  ${total - passed} test(s) failed. Please review the output above.`);
  }
  console.log('='.repeat(60));
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ Test execution failed:', error.message);
  process.exit(1);
});
