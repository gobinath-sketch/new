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
let createdOpportunityId = null;
let createdProgramId = null;

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

// Login function
async function login(role) {
  try {
    const user = testUsers[role];
    if (!user) {
      throw new Error(`No test user found for role: ${role}`);
    }

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
    throw new Error(`Login failed for ${role}: ${error.response?.data?.error || error.message}`);
  }
}

// Get notifications for a role
async function getNotifications(role) {
  try {
    const response = await axios.get(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${tokens[role]}` },
      timeout: 10000
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch notifications: ${error.response?.data?.error || error.message}`);
  }
}

// Create opportunity
async function createOpportunity(role) {
  try {
    const response = await axios.post(
      `${BASE_URL}/opportunities`,
      {
        trainingOpportunity: 'Training',
        trainingSector: 'Corporate',
        technology: 'React',
        courseName: 'React Advanced',
        billingClient: 'Test Client for Notifications',
        endClient: 'Test End Client',
        numberOfParticipants: 25,
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
        numberOfDays: 5,
        modeOfTraining: 'Virtual',
        tov: 500000
      },
      {
        headers: { Authorization: `Bearer ${tokens[role]}` },
        timeout: 10000
      }
    );
    return response.data;
  } catch (error) {
    throw new Error(`Failed to create opportunity: ${error.response?.data?.error || error.message}`);
  }
}

// Create program
async function createProgram(role) {
  try {
    const currentDate = new Date();
    const response = await axios.post(
      `${BASE_URL}/programs`,
      {
        trainingOpportunity: 'Training',
        trainingSector: 'Corporate',
        trainingSupporter: 'GKT',
        trainingYear: currentDate.getFullYear(),
        trainingMonth: currentDate.toLocaleString('default', { month: 'long' }),
        billingClient: 'Test Billing Client',
        endClient: 'Test End Client',
        courseCode: 'TEST-001',
        courseName: 'React Advanced',
        technology: 'React',
        numberOfParticipants: 25,
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
        numberOfDays: 5,
        location: 'Online',
        modeOfTraining: 'Virtual',
        tov: 500000
      },
      {
        headers: { Authorization: `Bearer ${tokens[role]}` },
        timeout: 10000
      }
    );
    return response.data;
  } catch (error) {
    throw new Error(`Failed to create program: ${error.response?.data?.error || error.message}`);
  }
}

// Test 1: Sales Executive creates opportunity - check notifications
async function testSalesExecutiveCreatesOpportunity() {
  console.log('\n📋 Test 1: Sales Executive Creates Opportunity');
  console.log('='.repeat(60));
  
  try {
    // Login as Sales Executive
    await login('Sales Executive');
    logTest('Sales Executive - Login', true);

    // Get initial notification count for relevant roles
    await login('Sales Manager');
    const smInitial = await getNotifications('Sales Manager');
    const smInitialCount = smInitial.notifications.length;

    await login('Operations Manager');
    const omInitial = await getNotifications('Operations Manager');
    const omInitialCount = omInitial.notifications.length;

    await login('Business Head');
    const bhInitial = await getNotifications('Business Head');
    const bhInitialCount = bhInitial.notifications.length;

    await login('Finance Manager');
    const fmInitial = await getNotifications('Finance Manager');
    const fmInitialCount = fmInitial.notifications.length;

    // Create opportunity as Sales Executive
    await login('Sales Executive');
    const opportunity = await createOpportunity('Sales Executive');
    createdOpportunityId = opportunity._id;
    logTest('Sales Executive - Create Opportunity', true, `ID: ${opportunity.opportunityId}`);

    // Wait 2 seconds for notification to be created
    console.log('   Waiting 2 seconds for notification creation...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check notifications for Sales Manager (should receive)
    await login('Sales Manager');
    const smNotifications = await getNotifications('Sales Manager');
    const smNewNotifications = smNotifications.notifications.filter(n => 
      n.type === 'opportunity_created' && 
      n.entityId === createdOpportunityId.toString()
    );
    logTest('Sales Manager - Received Notification', smNewNotifications.length > 0, 
      `Found ${smNewNotifications.length} notification(s)`);

    // Check notifications for Operations Manager (should receive)
    await login('Operations Manager');
    const omNotifications = await getNotifications('Operations Manager');
    const omNewNotifications = omNotifications.notifications.filter(n => 
      n.type === 'opportunity_created' && 
      n.entityId === createdOpportunityId.toString()
    );
    logTest('Operations Manager - Received Notification', omNewNotifications.length > 0,
      `Found ${omNewNotifications.length} notification(s)`);

    // Check notifications for Business Head (should receive)
    await login('Business Head');
    const bhNotifications = await getNotifications('Business Head');
    const bhNewNotifications = bhNotifications.notifications.filter(n => 
      n.type === 'opportunity_created' && 
      n.entityId === createdOpportunityId.toString()
    );
    logTest('Business Head - Received Notification', bhNewNotifications.length > 0,
      `Found ${bhNewNotifications.length} notification(s)`);

    // Check notifications for Finance Manager (should receive)
    await login('Finance Manager');
    const fmNotifications = await getNotifications('Finance Manager');
    const fmNewNotifications = fmNotifications.notifications.filter(n => 
      n.type === 'opportunity_created' && 
      n.entityId === createdOpportunityId.toString()
    );
    logTest('Finance Manager - Received Notification', fmNewNotifications.length > 0,
      `Found ${fmNewNotifications.length} notification(s)`);

    // Check Sales Executive (should NOT receive notification for own creation)
    await login('Sales Executive');
    const seNotifications = await getNotifications('Sales Executive');
    const seOwnNotifications = seNotifications.notifications.filter(n => 
      n.type === 'opportunity_created' && 
      n.entityId === createdOpportunityId.toString()
    );
    logTest('Sales Executive - No Self Notification', seOwnNotifications.length === 0,
      `Correctly not notified of own creation`);

    // Verify notification content
    if (smNewNotifications.length > 0) {
      const notif = smNewNotifications[0];
      logTest('Notification - Has Title', !!notif.title, notif.title);
      logTest('Notification - Has Message', !!notif.message, notif.message);
      logTest('Notification - Has Creator', !!notif.createdByName, notif.createdByName);
      logTest('Notification - Has Entity Type', notif.entityType === 'Opportunity', notif.entityType);
      logTest('Notification - Has Entity ID', notif.entityId === createdOpportunityId.toString(), 
        `Entity ID: ${notif.entityId}`);
      logTest('Notification - Is Unread', !notif.read, 'Unread status correct');
    }

    return true;
  } catch (error) {
    logTest('Sales Executive Creates Opportunity', false, error.message);
    return false;
  }
}

// Test 2: Operations Manager creates program - check notifications
async function testOperationsManagerCreatesProgram() {
  console.log('\n📦 Test 2: Operations Manager Creates Program');
  console.log('='.repeat(60));
  
  try {
    // Login as Operations Manager
    await login('Operations Manager');
    logTest('Operations Manager - Login', true);

    // Get initial notification counts
    await login('Business Head');
    const bhInitial = await getNotifications('Business Head');
    const bhInitialCount = bhInitial.notifications.length;

    await login('Director');
    const dirInitial = await getNotifications('Director');
    const dirInitialCount = dirInitial.notifications.length;

    // Create program
    const program = await createProgram('Operations Manager');
    createdProgramId = program._id;
    logTest('Operations Manager - Create Program', true, `ID: ${program.programCode}`);

    // Wait 2 seconds
    console.log('   Waiting 2 seconds for notification creation...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check Business Head (should receive)
    await login('Business Head');
    const bhNotifications = await getNotifications('Business Head');
    const bhNewNotifications = bhNotifications.notifications.filter(n => 
      n.type === 'program_created' && 
      n.entityId === createdProgramId.toString()
    );
    logTest('Business Head - Received Program Notification', bhNewNotifications.length > 0,
      `Found ${bhNewNotifications.length} notification(s)`);

    // Check Director (should receive)
    await login('Director');
    const dirNotifications = await getNotifications('Director');
    const dirNewNotifications = dirNotifications.notifications.filter(n => 
      n.type === 'program_created' && 
      n.entityId === createdProgramId.toString()
    );
    logTest('Director - Received Program Notification', dirNewNotifications.length > 0,
      `Found ${dirNewNotifications.length} notification(s)`);

    // Check Operations Manager (should NOT receive own notification)
    await login('Operations Manager');
    const omNotifications = await getNotifications('Operations Manager');
    const omOwnNotifications = omNotifications.notifications.filter(n => 
      n.type === 'program_created' && 
      n.entityId === createdProgramId.toString()
    );
    logTest('Operations Manager - No Self Notification', omOwnNotifications.length === 0,
      `Correctly not notified of own creation`);

    return true;
  } catch (error) {
    logTest('Operations Manager Creates Program', false, error.message);
    return false;
  }
}

// Test 3: Real-time updates
async function testRealTimeUpdates() {
  console.log('\n🔄 Test 3: Real-Time Notification Updates');
  console.log('='.repeat(60));
  
  try {
    // Login as Sales Manager
    await login('Sales Manager');
    const initial = await getNotifications('Sales Manager');
    const initialCount = initial.unreadCount;
    logTest('Sales Manager - Initial Unread Count', true, `Count: ${initialCount}`);

    // Create opportunity as Sales Executive
    await login('Sales Executive');
    const opportunity = await createOpportunity('Sales Executive');
    logTest('Sales Executive - Create Second Opportunity', true);

    // Wait 6 seconds (simulating real-time update cycle)
    console.log('   Waiting 6 seconds for real-time update...');
    await new Promise(resolve => setTimeout(resolve, 6000));

    // Check if notification count increased
    await login('Sales Manager');
    const updated = await getNotifications('Sales Manager');
    const updatedCount = updated.unreadCount;
    logTest('Sales Manager - Unread Count Updated', updatedCount > initialCount,
      `Count: ${initialCount} → ${updatedCount}`);

    return true;
  } catch (error) {
    logTest('Real-Time Updates', false, error.message);
    return false;
  }
}

// Test 4: Notification visibility - users only see their own notifications
async function testNotificationVisibility() {
  console.log('\n👁️ Test 4: Notification Visibility (Users See Only Their Notifications)');
  console.log('='.repeat(60));
  
  try {
    // Login as Sales Manager
    await login('Sales Manager');
    const smNotifications = await getNotifications('Sales Manager');
    logTest('Sales Manager - Can Fetch Notifications', true, 
      `Total: ${smNotifications.notifications.length}, Unread: ${smNotifications.unreadCount}`);

    // Verify all notifications belong to Sales Manager
    const allOwnNotifications = smNotifications.notifications.every(n => 
      n.role === 'Sales Manager'
    );
    logTest('Sales Manager - All Notifications Are Own', allOwnNotifications,
      'All notifications belong to Sales Manager');

    // Login as Operations Manager
    await login('Operations Manager');
    const omNotifications = await getNotifications('Operations Manager');
    logTest('Operations Manager - Can Fetch Notifications', true,
      `Total: ${omNotifications.notifications.length}, Unread: ${omNotifications.unreadCount}`);

    // Verify all notifications belong to Operations Manager
    const omAllOwn = omNotifications.notifications.every(n => 
      n.role === 'Operations Manager'
    );
    logTest('Operations Manager - All Notifications Are Own', omAllOwn,
      'All notifications belong to Operations Manager');

    // Verify Sales Manager cannot see Operations Manager notifications
    const smCannotSeeOM = !smNotifications.notifications.some(n => 
      n.role === 'Operations Manager'
    );
    logTest('Sales Manager - Cannot See Other Role Notifications', smCannotSeeOM,
      'Correctly isolated');

    return true;
  } catch (error) {
    logTest('Notification Visibility', false, error.message);
    return false;
  }
}

// Test 5: Mark as read functionality
async function testMarkAsRead() {
  console.log('\n✅ Test 5: Mark Notification as Read');
  console.log('='.repeat(60));
  
  try {
    await login('Sales Manager');
    const before = await getNotifications('Sales Manager');
    const unreadBefore = before.unreadCount;

    if (unreadBefore > 0) {
      // Find an unread notification
      const unreadNotif = before.notifications.find(n => !n.read);
      
      if (unreadNotif) {
        // Mark as read
        const response = await axios.put(
          `${BASE_URL}/notifications/${unreadNotif._id}/read`,
          {},
          {
            headers: { Authorization: `Bearer ${tokens['Sales Manager']}` },
            timeout: 10000
          }
        );
        logTest('Mark Notification as Read', response.data.read === true, 
          `Notification ${unreadNotif._id} marked as read`);

        // Verify unread count decreased
        const after = await getNotifications('Sales Manager');
        const unreadAfter = after.unreadCount;
        logTest('Unread Count Decreased', unreadAfter < unreadBefore,
          `Count: ${unreadBefore} → ${unreadAfter}`);
      } else {
        logTest('Mark Notification as Read', true, 'No unread notifications to test');
      }
    } else {
      logTest('Mark Notification as Read', true, 'No unread notifications');
    }

    return true;
  } catch (error) {
    logTest('Mark as Read', false, error.message);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Notification System Real-Time Test Suite\n');
  console.log('='.repeat(60));

  try {
    // Run all tests
    await testSalesExecutiveCreatesOpportunity();
    await testOperationsManagerCreatesProgram();
    await testRealTimeUpdates();
    await testNotificationVisibility();
    await testMarkAsRead();

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
    
    process.exit(results.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
