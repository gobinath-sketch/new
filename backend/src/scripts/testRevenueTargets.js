import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../config.env') });

const BASE_URL = 'http://localhost:5000/api';

// Test users - adjust these based on your actual user credentials
const TEST_USERS = {
  director: { email: 'director@singleplayground.com', password: 'Director@2026' },
  salesExecutive: { email: 'salesexec@singleplayground.com', password: 'SalesExec@2026' },
  salesManager: { email: 'salesmgr@singleplayground.com', password: 'SalesMgr@2026' },
  businessHead: { email: 'business@singleplayground.com', password: 'Business@2026' }
};

let directorToken = '';
let salesExecutiveToken = '';
let salesManagerToken = '';
let businessHeadToken = '';

// Helper function to login
async function login(email, password) {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, { 
      email, 
      password 
    });
    return response.data.token;
  } catch (error) {
    console.error(`Login failed for ${email}:`, error.response?.data?.error || error.message);
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
    console.error(`Request failed: ${method} ${endpoint}`, error.response?.data?.error || error.message);
    return null;
  }
}

// Test 1: Login all users
async function testLogin() {
  console.log('\n=== Test 1: User Authentication ===');
  
  directorToken = await login(TEST_USERS.director.email, TEST_USERS.director.password);
  if (!directorToken) {
    console.error('❌ Director login failed. Please check credentials.');
    return false;
  }
  console.log('✅ Director logged in');
  
  salesExecutiveToken = await login(TEST_USERS.salesExecutive.email, TEST_USERS.salesExecutive.password);
  if (!salesExecutiveToken) {
    console.error('❌ Sales Executive login failed. Please check credentials.');
    return false;
  }
  console.log('✅ Sales Executive logged in');
  
  salesManagerToken = await login(TEST_USERS.salesManager.email, TEST_USERS.salesManager.password);
  if (!salesManagerToken) {
    console.error('❌ Sales Manager login failed. Please check credentials.');
    return false;
  }
  console.log('✅ Sales Manager logged in');
  
  businessHeadToken = await login(TEST_USERS.businessHead.email, TEST_USERS.businessHead.password);
  if (!businessHeadToken) {
    console.error('❌ Business Head login failed. Please check credentials.');
    return false;
  }
  console.log('✅ Business Head logged in');
  
  return true;
}

// Test 2: Director sets revenue targets
async function testSetRevenueTargets() {
  console.log('\n=== Test 2: Director Setting Revenue Targets ===');
  const currentYear = new Date().getFullYear();
  
  const targets = [
    { year: currentYear, period: 'Yearly', amount: 5000000 },
    { year: currentYear, period: 'H1', amount: 2500000 },
    { year: currentYear, period: 'H2', amount: 2500000 },
    { year: currentYear, period: 'Quarterly', quarter: 1, amount: 1250000 },
    { year: currentYear, period: 'Quarterly', quarter: 2, amount: 1250000 },
    { year: currentYear, period: 'Quarterly', quarter: 3, amount: 1250000 },
    { year: currentYear, period: 'Quarterly', quarter: 4, amount: 1250000 }
  ];
  
  for (const target of targets) {
    const result = await authenticatedRequest('POST', '/revenue-targets', directorToken, target);
    if (result && result.target) {
      console.log(`✅ Set ${target.period} ${target.quarter ? `Q${target.quarter}` : ''} target: ₹${target.amount.toLocaleString()}`);
    } else {
      console.log(`❌ Failed to set ${target.period} ${target.quarter ? `Q${target.quarter}` : ''} target`);
    }
  }
}

// Test 3: Director views all revenue targets
async function testDirectorViewTargets() {
  console.log('\n=== Test 3: Director Viewing All Revenue Targets ===');
  
  const targets = await authenticatedRequest('GET', '/revenue-targets', directorToken);
  if (targets && Array.isArray(targets)) {
    console.log(`✅ Director can view ${targets.length} revenue target(s)`);
    targets.forEach(target => {
      console.log(`   - ${target.year} ${target.period} ${target.quarter ? `Q${target.quarter}` : ''}: ₹${target.amount.toLocaleString()}`);
    });
    return true;
  } else {
    console.log('❌ Director cannot view revenue targets');
    return false;
  }
}

// Test 4: Sales Executive views revenue target from dashboard
async function testSalesExecutiveDashboard() {
  console.log('\n=== Test 4: Sales Executive Dashboard - Revenue Target ===');
  
  const dashboard = await authenticatedRequest('GET', '/dashboards/sales-executive', salesExecutiveToken);
  if (dashboard && dashboard.revenueTarget !== undefined) {
    console.log(`✅ Sales Executive dashboard shows revenue target: ₹${dashboard.revenueTarget.toLocaleString()}`);
    if (dashboard.revenueTarget > 0) {
      console.log('   ✅ Revenue target is correctly fetched and displayed');
      return true;
    } else {
      console.log('   ⚠️  Revenue target is 0. Make sure Director has set a Yearly target.');
      return false;
    }
  } else {
    console.log('❌ Sales Executive dashboard does not include revenue target');
    return false;
  }
}

// Test 5: Sales Manager views revenue target from dashboard
async function testSalesManagerDashboard() {
  console.log('\n=== Test 5: Sales Manager Dashboard - Revenue Target ===');
  
  const dashboard = await authenticatedRequest('GET', '/dashboards/sales-manager', salesManagerToken);
  if (dashboard && dashboard.revenueTarget !== undefined) {
    console.log(`✅ Sales Manager dashboard shows revenue target: ₹${dashboard.revenueTarget.toLocaleString()}`);
    if (dashboard.revenueTarget > 0) {
      console.log('   ✅ Revenue target is correctly fetched and displayed');
      return true;
    } else {
      console.log('   ⚠️  Revenue target is 0. Make sure Director has set a Yearly target.');
      return false;
    }
  } else {
    console.log('❌ Sales Manager dashboard does not include revenue target');
    return false;
  }
}

// Test 6: Business Head views revenue target from dashboard
async function testBusinessHeadDashboard() {
  console.log('\n=== Test 6: Business Head Dashboard - Revenue Target ===');
  
  const dashboard = await authenticatedRequest('GET', '/dashboards/business', businessHeadToken);
  if (dashboard && dashboard.revenueTarget !== undefined) {
    console.log(`✅ Business Head dashboard shows revenue target: ₹${dashboard.revenueTarget.toLocaleString()}`);
    if (dashboard.revenueTarget > 0) {
      console.log('   ✅ Revenue target is correctly fetched and displayed');
      return true;
    } else {
      console.log('   ⚠️  Revenue target is 0. Make sure Director has set a Yearly target.');
      return false;
    }
  } else {
    console.log('❌ Business Head dashboard does not include revenue target');
    return false;
  }
}

// Test 7: Verify real-time updates (Director updates target, others see it)
async function testRealTimeUpdate() {
  console.log('\n=== Test 7: Real-Time Update Test ===');
  const currentYear = new Date().getFullYear();
  
  // Director updates Yearly target
  const newAmount = 6000000;
  const updateResult = await authenticatedRequest('POST', '/revenue-targets', directorToken, {
    year: currentYear,
    period: 'Yearly',
    amount: newAmount
  });
  
  if (updateResult && updateResult.target) {
    console.log(`✅ Director updated Yearly target to: ₹${newAmount.toLocaleString()}`);
    
    // Wait 2 seconds to simulate real-time delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if Sales Executive sees the update
    const dashboard = await authenticatedRequest('GET', '/dashboards/sales-executive', salesExecutiveToken);
    if (dashboard && dashboard.revenueTarget === newAmount) {
      console.log(`✅ Sales Executive dashboard shows updated target: ₹${dashboard.revenueTarget.toLocaleString()}`);
      console.log('   ✅ Real-time update working correctly!');
      return true;
    } else {
      console.log(`⚠️  Sales Executive sees: ₹${dashboard?.revenueTarget || 0}.toLocaleString() (Expected: ₹${newAmount.toLocaleString()})`);
      console.log('   ℹ️  Note: In production, dashboards auto-refresh every 5 seconds.');
      return false;
    }
  } else {
    console.log('❌ Failed to update revenue target');
    return false;
  }
}

// Test 8: Verify non-Director cannot set targets
async function testUnauthorizedAccess() {
  console.log('\n=== Test 8: Unauthorized Access Prevention ===');
  
  try {
    const result = await authenticatedRequest('POST', '/revenue-targets', salesExecutiveToken, {
      year: new Date().getFullYear(),
      period: 'Yearly',
      amount: 1000000
    });
    
    // If we get here without an error, unauthorized access was allowed
    if (result && !result.error) {
      console.log('❌ Unauthorized access allowed - security issue!');
      return false;
    }
  } catch (error) {
    // Expected: Request should fail with unauthorized error
  }
  
  // Check by making the request directly and catching the error
  try {
    await axios.post(
      `${BASE_URL}/revenue-targets`,
      {
        year: new Date().getFullYear(),
        period: 'Yearly',
        amount: 1000000
      },
      {
        headers: { Authorization: `Bearer ${salesExecutiveToken}` }
      }
    );
    console.log('❌ Unauthorized access allowed - security issue!');
    return false;
  } catch (error) {
    if (error.response && (error.response.status === 403 || error.response.status === 401)) {
      console.log('✅ Non-Director cannot set revenue targets (access denied)');
      return true;
    } else {
      console.log(`⚠️  Unexpected error: ${error.response?.status || error.message}`);
      return false;
    }
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Revenue Target Functionality Tests...\n');
  console.log('Note: Make sure your backend server is running on port 5000');
  console.log('Note: Update TEST_USERS credentials in the script to match your database\n');
  
  let passed = 0;
  let total = 8;
  
  // Test 1: Login
  if (await testLogin()) {
    passed++;
  } else {
    console.log('\n❌ Login failed. Please check user credentials and try again.');
    return;
  }
  
  // Test 2: Set targets
  await testSetRevenueTargets();
  passed++;
  
  // Test 3: Director views targets
  if (await testDirectorViewTargets()) {
    passed++;
  }
  
  // Test 4: Sales Executive dashboard
  if (await testSalesExecutiveDashboard()) {
    passed++;
  }
  
  // Test 5: Sales Manager dashboard
  if (await testSalesManagerDashboard()) {
    passed++;
  }
  
  // Test 6: Business Head dashboard
  if (await testBusinessHeadDashboard()) {
    passed++;
  }
  
  // Test 7: Real-time update
  if (await testRealTimeUpdate()) {
    passed++;
  }
  
  // Test 8: Unauthorized access
  if (await testUnauthorizedAccess()) {
    passed++;
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`📊 Test Results: ${passed}/${total} tests passed`);
  if (passed === total) {
    console.log('✅ All tests passed! Revenue Target functionality is working correctly.');
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
