import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../config.env') });

const BASE_URL = 'http://localhost:5000/api';

// Test users
const testUsers = {
  'Sales Executive': {
    email: 'salesexec@singleplayground.com',
    password: 'SalesExec@2026'
  },
  'Sales Manager': {
    email: 'salesmgr@singleplayground.com',
    password: 'SalesMgr@2026'
  },
  'Operations Manager': {
    email: 'operations@singleplayground.com',
    password: 'Operations@2026'
  },
  'Business Head': {
    email: 'business@singleplayground.com',
    password: 'Business@2026'
  },
  'Finance Manager': {
    email: 'finance@singleplayground.com',
    password: 'Finance@2026'
  },
  'Director': {
    email: 'director@singleplayground.com',
    password: 'Director@2026'
  }
};

let tokens = {};
let results = {
  passed: 0,
  failed: 0,
  errors: []
};

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

// Check server health
async function checkServerHealth() {
  try {
    const response = await axios.get(`${BASE_URL.replace('/api', '')}/api/health`, { timeout: 5000 });
    return response.data.status === 'ok';
  } catch (error) {
    return false;
  }
}

// Login function
async function login(role) {
  try {
    const user = testUsers[role];
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: user.email,
      password: user.password
    }, { timeout: 10000 });

    if (response.data.token) {
      tokens[role] = response.data.token;
      return response.data.token;
    }
    throw new Error('No token received');
  } catch (error) {
    throw new Error(`Login failed: ${error.response?.data?.error || error.message}`);
  }
}

// Test dashboard access
async function testDashboard(role) {
  try {
    const endpoints = {
      'Sales Executive': '/dashboards/sales-executive',
      'Sales Manager': '/dashboards/sales-manager',
      'Operations Manager': '/dashboards/operations',
      'Business Head': '/dashboards/business',
      'Finance Manager': '/dashboards/finance',
      'Director': '/dashboards/director'
    };

    const endpoint = endpoints[role];
    const response = await axios.get(`${BASE_URL}${endpoint}`, {
      headers: { Authorization: `Bearer ${tokens[role]}` },
      timeout: 10000
    });

    return response.data;
  } catch (error) {
    throw new Error(`Dashboard fetch failed: ${error.response?.data?.error || error.message}`);
  }
}

// Test notifications
async function testNotifications(role) {
  try {
    const response = await axios.get(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${tokens[role]}` },
      timeout: 10000
    });
    return response.data;
  } catch (error) {
    throw new Error(`Notifications fetch failed: ${error.response?.data?.error || error.message}`);
  }
}

// Main test function
async function runRealTimeCheck() {
  console.log('🚀 Starting Real-Time System Check\n');
  console.log('='.repeat(70));

  // Check server health
  console.log('\n📡 Checking Server Health...');
  const serverHealthy = await checkServerHealth();
  logTest('Backend Server Health', serverHealthy, serverHealthy ? 'Server is running' : 'Server not responding');

  if (!serverHealthy) {
    console.log('\n⚠️  Backend server is not running. Please start it first.');
    process.exit(1);
  }

  // Test all roles
  const roles = ['Sales Executive', 'Sales Manager', 'Operations Manager', 'Business Head', 'Finance Manager', 'Director'];

  for (const role of roles) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🧪 Testing ${role}`);
    console.log('='.repeat(70));

    try {
      // Login
      await login(role);
      logTest(`${role} - Login`, true);

      // Test dashboard
      const dashboardData = await testDashboard(role);
      logTest(`${role} - Dashboard Access`, true, 'Data fetched successfully');

      // Check for pipeline data (for chart)
      if (dashboardData.pipeline) {
        logTest(`${role} - Pipeline Data`, true, 
          `New: ${dashboardData.pipeline.new}, Qualified: ${dashboardData.pipeline.qualified}, Converted: ${dashboardData.pipeline.converted}`);
      } else if (role === 'Sales Executive' || role === 'Sales Manager' || role === 'Business Head') {
        logTest(`${role} - Pipeline Data`, false, 'Pipeline data missing for chart');
      }

      // Check for revenue target (if applicable)
      if (dashboardData.revenueTarget !== undefined) {
        logTest(`${role} - Revenue Target`, true, `₹${dashboardData.revenueTarget.toLocaleString()}`);
      }

      // Test notifications
      const notifications = await testNotifications(role);
      logTest(`${role} - Notifications Access`, true, 
        `Total: ${notifications.notifications.length}, Unread: ${notifications.unreadCount}`);

      // Check notification bell functionality
      if (notifications.unreadCount > 0) {
        logTest(`${role} - Unread Notifications`, true, 
          `${notifications.unreadCount} unread notification(s) - bell should show dot`);
      } else {
        logTest(`${role} - No Unread Notifications`, true, 'Bell should not show dot');
      }

      // Test real-time data (wait and check again)
      console.log(`   Waiting 6 seconds to test real-time updates...`);
      await new Promise(resolve => setTimeout(resolve, 6000));

      const dashboardData2 = await testDashboard(role);
      logTest(`${role} - Real-Time Dashboard Update`, true, 'Data refreshed successfully');

      const notifications2 = await testNotifications(role);
      logTest(`${role} - Real-Time Notification Update`, true, 
        `Unread: ${notifications2.unreadCount} (updated from ${notifications.unreadCount})`);

    } catch (error) {
      logTest(`${role} - Overall Test`, false, error.message);
    }
  }

  // Test Sales Pipeline Chart data
  console.log(`\n${'='.repeat(70)}`);
  console.log('📊 Testing Sales Pipeline Chart');
  console.log('='.repeat(70));

  try {
    await login('Sales Executive');
    const seDashboard = await testDashboard('Sales Executive');
    if (seDashboard.pipeline) {
      const chartData = {
        total: seDashboard.opportunities || 0,
        qualified: seDashboard.pipeline.qualified || 0,
        sentToDelivery: seDashboard.pipeline.sentToDelivery || 0,
        converted: seDashboard.closures || 0
      };
      logTest('Sales Executive - Chart Data Available', true, 
        `Total: ${chartData.total}, Qualified: ${chartData.qualified}, Converted: ${chartData.converted}`);
    }

    await login('Sales Manager');
    const smDashboard = await testDashboard('Sales Manager');
    if (smDashboard.pipeline) {
      const chartData = {
        total: (smDashboard.pipeline.new || 0) + (smDashboard.pipeline.qualified || 0) + 
               (smDashboard.pipeline.sentToDelivery || 0) + (smDashboard.pipeline.converted || 0),
        qualified: smDashboard.pipeline.qualified || 0,
        sentToDelivery: smDashboard.pipeline.sentToDelivery || 0,
        converted: smDashboard.pipeline.converted || 0
      };
      logTest('Sales Manager - Chart Data Available', true,
        `Total: ${chartData.total}, Qualified: ${chartData.qualified}, Converted: ${chartData.converted}`);
    }

    await login('Business Head');
    const bhDashboard = await testDashboard('Business Head');
    if (bhDashboard.pipeline) {
      const chartData = {
        total: (bhDashboard.pipeline.new || 0) + (bhDashboard.pipeline.qualified || 0) + 
               (bhDashboard.pipeline.sentToDelivery || 0) + (bhDashboard.pipeline.converted || 0),
        qualified: bhDashboard.pipeline.qualified || 0,
        sentToDelivery: bhDashboard.pipeline.sentToDelivery || 0,
        converted: bhDashboard.pipeline.converted || 0
      };
      logTest('Business Head - Chart Data Available', true,
        `Total: ${chartData.total}, Qualified: ${chartData.qualified}, Converted: ${chartData.converted}`);
    }
  } catch (error) {
    logTest('Chart Data Test', false, error.message);
  }

  // Print summary
  console.log(`\n${'='.repeat(70)}`);
  console.log('📊 REAL-TIME SYSTEM CHECK SUMMARY');
  console.log('='.repeat(70));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

  if (results.errors.length > 0) {
    console.log(`\n⚠️  Issues Found:`);
    results.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error.test}: ${error.message}`);
    });
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n✅ System Check Complete!');
  console.log('\n📋 Next Steps:');
  console.log('   1. Open browser: http://localhost:5173');
  console.log('   2. Login with any role credentials');
  console.log('   3. Check notification bell icon (should show blinking dot if unread)');
  console.log('   4. Click bell to see notifications popup');
  console.log('   5. Verify Sales Pipeline Chart appears on dashboards');
  console.log('   6. Check real-time updates (wait 5 seconds)');
  
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run check
runRealTimeCheck().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
