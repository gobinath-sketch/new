import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

// Configure axios with better timeout and error handling
axios.defaults.timeout = 10000;
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Test users with correct emails and passwords
const testUsers = {
  'Sales Executive': {
    email: 'salesexec@singleplayground.com',
    password: 'SalesExec@2026'
  },
  'Sales Manager': {
    email: 'salesmgr@singleplayground.com',
    password: 'SalesMgr@2026'
  },
  'Business Head': {
    email: 'business@singleplayground.com',
    password: 'Business@2026'
  }
};

let results = {
  passed: 0,
  failed: 0,
  errors: []
};

// Helper function to log results
function logTest(testName, passed, message = '') {
  if (passed) {
    console.log(`✅ PASS: ${testName}${message ? ` - ${message}` : ''}`);
    results.passed++;
  } else {
    console.log(`❌ FAIL: ${testName}${message ? ` - ${message}` : ''}`);
    results.failed++;
    results.errors.push({ test: testName, message });
  }
}

// Login function with retry
async function login(role, retries = 3) {
  const user = testUsers[role];
  if (!user) {
    throw new Error(`No test user found for role: ${role}`);
  }

  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.post(`${BASE_URL}/auth/login`, {
        email: user.email,
        password: user.password
      }, {
        timeout: 10000
      });

      if (response.data.token) {
        return response.data.token;
      }
      throw new Error('No token received');
    } catch (error) {
      if (i === retries - 1) {
        throw new Error(`Login failed for ${role} after ${retries} attempts: ${error.response?.data?.error || error.message}`);
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// Test dashboard data fetch with retry
async function testDashboardData(role, token, retries = 3) {
  const endpoints = {
    'Sales Executive': '/dashboards/sales-executive',
    'Sales Manager': '/dashboards/sales-manager',
    'Business Head': '/dashboards/business'
  };

  const endpoint = endpoints[role];
  if (!endpoint) {
    throw new Error(`No endpoint found for role: ${role}`);
  }

  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get(`${BASE_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });

      return response.data;
    } catch (error) {
      if (i === retries - 1) {
        throw new Error(`Dashboard fetch failed: ${error.response?.data?.error || error.message}`);
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// Test chart data structure
function testChartDataStructure(dashboardData, role) {
  console.log(`\n📊 Testing Chart Data Structure for ${role}...`);
  
  // Check if pipeline data exists
  if (!dashboardData.pipeline) {
    logTest(`${role} - Pipeline data exists`, false, 'Pipeline data not found in dashboard response');
    return false;
  }
  logTest(`${role} - Pipeline data exists`, true);

  // Check required pipeline fields
  const requiredFields = ['new', 'qualified', 'sentToDelivery', 'converted'];
  let allFieldsPresent = true;
  
  requiredFields.forEach(field => {
    if (dashboardData.pipeline[field] === undefined) {
      logTest(`${role} - Pipeline field: ${field}`, false, 'Field missing');
      allFieldsPresent = false;
    } else {
      logTest(`${role} - Pipeline field: ${field}`, true, `Value: ${dashboardData.pipeline[field]}`);
    }
  });

  // Calculate total for chart
  const total = (dashboardData.pipeline.new || 0) + 
                (dashboardData.pipeline.qualified || 0) + 
                (dashboardData.pipeline.sentToDelivery || 0) + 
                (dashboardData.pipeline.converted || 0) + 
                (dashboardData.pipeline.lost || 0);
  
  // For Sales Executive, use opportunities if available
  const chartTotal = role === 'Sales Executive' && dashboardData.opportunities 
    ? dashboardData.opportunities 
    : total;

  console.log(`\n📈 Chart Data Summary for ${role}:`);
  console.log(`   Total Opportunities: ${chartTotal}`);
  console.log(`   Qualified: ${dashboardData.pipeline.qualified || 0}`);
  console.log(`   Sent to Delivery: ${dashboardData.pipeline.sentToDelivery || 0}`);
  console.log(`   Converted: ${dashboardData.pipeline.converted || 0}`);

  // Calculate percentages
  const qualifiedPct = chartTotal > 0 ? ((dashboardData.pipeline.qualified || 0) / chartTotal * 100).toFixed(1) : 0;
  const sentToDeliveryPct = chartTotal > 0 ? ((dashboardData.pipeline.sentToDelivery || 0) / chartTotal * 100).toFixed(1) : 0;
  const convertedPct = chartTotal > 0 ? ((dashboardData.pipeline.converted || 0) / chartTotal * 100).toFixed(1) : 0;

  console.log(`   Qualified %: ${qualifiedPct}%`);
  console.log(`   Sent to Delivery %: ${sentToDeliveryPct}%`);
  console.log(`   Converted %: ${convertedPct}%`);

  // Verify percentages are valid
  if (qualifiedPct >= 0 && qualifiedPct <= 100) {
    logTest(`${role} - Qualified percentage valid`, true);
  } else {
    logTest(`${role} - Qualified percentage valid`, false, `Invalid percentage: ${qualifiedPct}%`);
  }

  if (sentToDeliveryPct >= 0 && sentToDeliveryPct <= 100) {
    logTest(`${role} - Sent to Delivery percentage valid`, true);
  } else {
    logTest(`${role} - Sent to Delivery percentage valid`, false, `Invalid percentage: ${sentToDeliveryPct}%`);
  }

  if (convertedPct >= 0 && convertedPct <= 100) {
    logTest(`${role} - Converted percentage valid`, true);
  } else {
    logTest(`${role} - Converted percentage valid`, false, `Invalid percentage: ${convertedPct}%`);
  }

  return allFieldsPresent;
}

// Test real-time updates
async function testRealTimeUpdates(role, token, initialData) {
  console.log(`\n🔄 Testing Real-Time Updates for ${role}...`);
  
  try {
    // Wait 6 seconds (more than the 5-second refresh interval)
    console.log('   Waiting 6 seconds for real-time update...');
    await new Promise(resolve => setTimeout(resolve, 6000));

    // Fetch dashboard data again
    const updatedData = await testDashboardData(role, token);
    
    // Compare data (values might change in real-time)
    const initialTotal = (initialData.pipeline?.new || 0) + 
                         (initialData.pipeline?.qualified || 0) + 
                         (initialData.pipeline?.sentToDelivery || 0) + 
                         (initialData.pipeline?.converted || 0);
    
    const updatedTotal = (updatedData.pipeline?.new || 0) + 
                         (updatedData.pipeline?.qualified || 0) + 
                         (updatedData.pipeline?.sentToDelivery || 0) + 
                         (updatedData.pipeline?.converted || 0);

    console.log(`   Initial Total: ${initialTotal}`);
    console.log(`   Updated Total: ${updatedTotal}`);
    
    // Data should be accessible (values may change, which is expected)
    if (updatedData.pipeline) {
      logTest(`${role} - Real-time data accessible`, true, 'Data fetched successfully after 6 seconds');
    } else {
      logTest(`${role} - Real-time data accessible`, false, 'Pipeline data missing in updated fetch');
    }

    return true;
  } catch (error) {
    logTest(`${role} - Real-time updates`, false, error.message);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Sales Pipeline Chart Real-Time Test Suite\n');
  console.log('=' .repeat(60));

  // Test each role
  for (const role of ['Sales Executive', 'Sales Manager', 'Business Head']) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 Testing ${role} Dashboard`);
    console.log('='.repeat(60));

    try {
      // Login
      console.log(`\n🔐 Logging in as ${role}...`);
      const token = await login(role);
      logTest(`${role} - Login`, true);

      // Fetch dashboard data
      console.log(`\n📥 Fetching dashboard data...`);
      const dashboardData = await testDashboardData(role, token);
      logTest(`${role} - Dashboard data fetched`, true);

      // Test chart data structure
      const chartDataValid = testChartDataStructure(dashboardData, role);

      // Test real-time updates
      await testRealTimeUpdates(role, token, dashboardData);

      // Test zero values handling
      if (dashboardData.pipeline.qualified === 0) {
        console.log(`\n⚠️  Note: ${role} has zero qualified opportunities (testing edge case)`);
        const qualifiedPct = dashboardData.pipeline.qualified || 0;
        if (qualifiedPct === 0) {
          logTest(`${role} - Zero values handling`, true, 'Zero qualified handled correctly');
        }
      }

    } catch (error) {
      logTest(`${role} - Overall test`, false, error.message);
      console.error(`Error testing ${role}:`, error.message);
    }
  }

  // Print summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

  if (results.errors.length > 0) {
    console.log(`\n⚠️  Errors:`);
    results.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error.test}: ${error.message}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  
  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
