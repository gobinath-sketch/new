import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../config.env') });

const API_BASE = 'http://localhost:5000/api';
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

const testUsers = {
  'Business Head': { email: 'business@singleplayground.com', password: 'Business@2026' },
  'Director': { email: 'director@singleplayground.com', password: 'Director@2026' },
  'Sales Executive': { email: 'salesexec@singleplayground.com', password: 'SalesExec@2026' }
};

let authTokens = {};
let createdOpportunities = [];

const log = (message, type = 'info') => {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[type] || ''}${message}${colors.reset}`);
};

const runTest = async (name, testFn) => {
  testResults.total++;
  try {
    await testFn();
    testResults.passed++;
    log(`✅ PASS: ${name}`, 'success');
    return true;
  } catch (error) {
    testResults.failed++;
    const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
    testResults.errors.push({ test: name, error: errorMsg });
    log(`❌ FAIL: ${name} - ${errorMsg}`, 'error');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'error');
    }
    return false;
  }
};

const getAuthHeaders = (role) => ({
  headers: { Authorization: `Bearer ${authTokens[role]}` }
});

const runGPPopupTests = async () => {
  log('\n🚨 TESTING GP POPUP ALERTS', 'info');
  log('='.repeat(80), 'info');

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    log('✅ Connected to MongoDB', 'success');

    // Login as all required roles
    for (const [role, credentials] of Object.entries(testUsers)) {
      await runTest(`Login as ${role}`, async () => {
        const response = await axios.post(`${API_BASE}/auth/login`, {
          email: credentials.email,
          password: credentials.password,
          role: role
        });
        if (!response.data.token) throw new Error('No token received');
        authTokens[role] = response.data.token;
      });
    }

    // ========== TEST 1: Create Opportunity with GP < 15% (for Business Head) ==========
    await runTest('Create Opportunity with GP 12% (< 15%)', async () => {
      const oppData = {
        trainingOpportunity: 'Training',
        trainingSector: 'Corporate',
        trainingStatus: 'Scheduled',
        trainingSupporter: 'GKT',
        sales: 'Test Sales',
        trainingYear: 2026,
        trainingMonth: 'January',
        billingClient: 'Test Client Low GP',
        endClient: 'Test Client Low GP',
        courseCode: 'LOWGP001',
        courseName: 'Low GP Training',
        technology: 'IBM',
        numberOfParticipants: 30,
        attendance: 30,
        startDate: '2026-03-01',
        endDate: '2026-03-05',
        numberOfDays: 5,
        location: 'Online',
        trainer: 'Trainer 1',
        tov: 1000000,
        trainerPOValues: 350000,
        labPOValue: 250000,
        courseMaterial: 100000,
        royaltyCharges: 100000,
        travelCharges: 50000,
        accommodation: 50000,
        perDiem: 30000,
        localConveyance: 20000,
        marketingChargesPercent: 10,
        contingencyPercent: 5
      };
      
      // For 12% GP: GP = 12% of 1000000 = 120000
      // Total costs = 1000000 - 120000 = 880000
      // Marketing = 10% of 1000000 = 100000
      // Contingency = 5% of 1000000 = 50000
      // Other costs needed: 880000 - 100000 - 50000 = 730000
      // Let's set: trainerPO = 280000, labPO = 200000, courseMaterial = 80000, royalty = 80000, travel = 30000, accommodation = 30000, perDiem = 20000, localConveyance = 10000
      // Total: 280000 + 200000 + 80000 + 80000 + 30000 + 30000 + 20000 + 10000 = 730000 ✓
      
      oppData.trainerPOValues = 280000;
      oppData.labPOValue = 200000;
      oppData.courseMaterial = 80000;
      oppData.royaltyCharges = 80000;
      oppData.travelCharges = 30000;
      oppData.accommodation = 30000;
      oppData.perDiem = 20000;
      oppData.localConveyance = 10000;
      
      const response = await axios.post(`${API_BASE}/opportunities`, oppData, getAuthHeaders('Sales Executive'));
      if (!response.data._id) throw new Error('Opportunity not created');
      
      const gpPercent = response.data.gpPercent;
      if (gpPercent < 11.5 || gpPercent > 13.5) {
        throw new Error(`GP% should be around 12%, got ${gpPercent.toFixed(2)}%`);
      }
      
      createdOpportunities.push(response.data._id);
      log(`   Created opportunity with GP: ${gpPercent.toFixed(2)}%`, 'info');
    });

    // ========== TEST 2: Create Opportunity with GP < 10% (for Director) ==========
    await runTest('Create Opportunity with GP 8% (< 10%)', async () => {
      const oppData = {
        trainingOpportunity: 'Training',
        trainingSector: 'Corporate',
        trainingStatus: 'Scheduled',
        trainingSupporter: 'GKT',
        sales: 'Test Sales',
        trainingYear: 2026,
        trainingMonth: 'February',
        billingClient: 'Test Client Very Low GP',
        endClient: 'Test Client Very Low GP',
        courseCode: 'VERYLOWGP001',
        courseName: 'Very Low GP Training',
        technology: 'IBM',
        numberOfParticipants: 30,
        attendance: 30,
        startDate: '2026-04-01',
        endDate: '2026-04-05',
        numberOfDays: 5,
        location: 'Online',
        trainer: 'Trainer 1',
        tov: 1000000,
        // For 8% GP: GP = 8% of 1000000 = 80000
        // Total costs = 1000000 - 80000 = 920000
        // Marketing = 10% of 1000000 = 100000
        // Contingency = 5% of 1000000 = 50000
        // Other costs needed: 920000 - 100000 - 50000 = 770000
        // Let's set: trainerPO = 320000, labPO = 220000, courseMaterial = 90000, royalty = 90000, travel = 30000, accommodation = 30000, perDiem = 20000, localConveyance = 10000
        // Total: 320000 + 220000 + 90000 + 90000 + 30000 + 30000 + 20000 + 10000 = 800000
        // Wait, that's 800000, but we need 770000. Let me adjust:
        // trainerPO = 290000, labPO = 220000, courseMaterial = 90000, royalty = 90000, travel = 30000, accommodation = 30000, perDiem = 20000, localConveyance = 10000
        // Total: 290000 + 220000 + 90000 + 90000 + 30000 + 30000 + 20000 + 10000 = 770000 ✓
        trainerPOValues: 290000,
        labPOValue: 220000,
        courseMaterial: 90000,
        royaltyCharges: 90000,
        travelCharges: 30000,
        accommodation: 30000,
        perDiem: 20000,
        localConveyance: 10000,
        marketingChargesPercent: 10, // 100000
        contingencyPercent: 5 // 50000
      };
      
      const response = await axios.post(`${API_BASE}/opportunities`, oppData, getAuthHeaders('Sales Executive'));
      if (!response.data._id) throw new Error('Opportunity not created');
      
      const gpPercent = response.data.gpPercent;
      if (gpPercent < 6.5 || gpPercent > 8.5) {
        throw new Error(`GP% should be around 8%, got ${gpPercent.toFixed(2)}%`);
      }
      
      createdOpportunities.push(response.data._id);
      log(`   Created opportunity with GP: ${gpPercent.toFixed(2)}%`, 'info');
    });

    // ========== TEST 3: Business Head Dashboard - Low GP Alert (< 15%) ==========
    await runTest('Business Head - Dashboard shows Low GP Alert (< 15%)', async () => {
      const response = await axios.get(`${API_BASE}/dashboards/business`, getAuthHeaders('Business Head'));
      
      if (!response.data.lowGPAlerts) {
        throw new Error('lowGPAlerts not found in dashboard response');
      }
      
      if (!Array.isArray(response.data.lowGPAlerts)) {
        throw new Error('lowGPAlerts is not an array');
      }
      
      if (response.data.lowGPAlerts.length === 0) {
        throw new Error('No low GP alerts found (expected at least 1 opportunity with GP < 15%)');
      }
      
      // Verify that all alerts have GP < 15%
      const invalidAlerts = response.data.lowGPAlerts.filter(item => {
        const gpPercent = item.gpPercent || (item.tov && item.tov > 0 ? (item.finalGP / item.tov * 100) : 0);
        return gpPercent >= 15;
      });
      
      if (invalidAlerts.length > 0) {
        throw new Error(`Found ${invalidAlerts.length} alerts with GP >= 15%`);
      }
      
      log(`   Found ${response.data.lowGPAlerts.length} low GP alert(s) (< 15%)`, 'info');
      response.data.lowGPAlerts.forEach((alert, idx) => {
        const gpPercent = alert.gpPercent || (alert.tov && alert.tov > 0 ? (alert.finalGP / alert.tov * 100) : 0);
        log(`   Alert ${idx + 1}: ${alert.opportunityId || 'N/A'} - GP: ${gpPercent.toFixed(2)}%`, 'info');
      });
    });

    // ========== TEST 4: Director Dashboard - Very Low GP Alert (< 10%) ==========
    await runTest('Director - Dashboard shows Very Low GP Alert (< 10%)', async () => {
      const response = await axios.get(`${API_BASE}/dashboards/director`, getAuthHeaders('Director'));
      
      if (!response.data.veryLowGPAlerts) {
        throw new Error('veryLowGPAlerts not found in dashboard response');
      }
      
      if (!Array.isArray(response.data.veryLowGPAlerts)) {
        throw new Error('veryLowGPAlerts is not an array');
      }
      
      if (response.data.veryLowGPAlerts.length === 0) {
        throw new Error('No very low GP alerts found (expected at least 1 opportunity with GP < 10%)');
      }
      
      // Verify that all alerts have GP < 10%
      const invalidAlerts = response.data.veryLowGPAlerts.filter(item => {
        const gpPercent = item.gpPercent || (item.tov && item.tov > 0 ? (item.finalGP / item.tov * 100) : 0);
        return gpPercent >= 10;
      });
      
      if (invalidAlerts.length > 0) {
        throw new Error(`Found ${invalidAlerts.length} alerts with GP >= 10%`);
      }
      
      log(`   Found ${response.data.veryLowGPAlerts.length} very low GP alert(s) (< 10%)`, 'info');
      response.data.veryLowGPAlerts.forEach((alert, idx) => {
        const gpPercent = alert.gpPercent || (alert.tov && alert.tov > 0 ? (alert.finalGP / alert.tov * 100) : 0);
        log(`   Alert ${idx + 1}: ${alert.opportunityId || 'N/A'} - GP: ${gpPercent.toFixed(2)}%`, 'info');
      });
    });

    // ========== TEST 5: Verify Alert Data Structure ==========
    await runTest('Business Head - Low GP Alert data structure is correct', async () => {
      const response = await axios.get(`${API_BASE}/dashboards/business`, getAuthHeaders('Business Head'));
      
      if (response.data.lowGPAlerts.length > 0) {
        const alert = response.data.lowGPAlerts[0];
        
        // Check required fields
        if (!alert.opportunityId && !alert.programName) {
          throw new Error('Alert missing opportunityId or programName');
        }
        
        if (!alert.tov && alert.tov !== 0) {
          throw new Error('Alert missing tov field');
        }
        
        if (alert.finalGP === undefined && alert.finalGP !== 0) {
          throw new Error('Alert missing finalGP field');
        }
        
        // Calculate gpPercent if not present
        const gpPercent = alert.gpPercent !== undefined 
          ? alert.gpPercent 
          : (alert.tov && alert.tov > 0 ? (alert.finalGP / alert.tov * 100) : 0);
        
        if (gpPercent === undefined || isNaN(gpPercent)) {
          throw new Error('Alert missing valid gpPercent field');
        }
        
        log(`   Alert structure valid: ${JSON.stringify({
          id: alert.opportunityId || alert.programName,
          tov: alert.tov,
          finalGP: alert.finalGP,
          gpPercent: gpPercent.toFixed(2) + '%'
        })}`, 'info');
      }
    });

    await runTest('Director - Very Low GP Alert data structure is correct', async () => {
      const response = await axios.get(`${API_BASE}/dashboards/director`, getAuthHeaders('Director'));
      
      if (response.data.veryLowGPAlerts.length > 0) {
        const alert = response.data.veryLowGPAlerts[0];
        
        // Check required fields
        if (!alert.opportunityId && !alert.programName) {
          throw new Error('Alert missing opportunityId or programName');
        }
        
        if (!alert.tov && alert.tov !== 0) {
          throw new Error('Alert missing tov field');
        }
        
        if (alert.finalGP === undefined && alert.finalGP !== 0) {
          throw new Error('Alert missing finalGP field');
        }
        
        // Calculate gpPercent if not present
        const gpPercent = alert.gpPercent !== undefined 
          ? alert.gpPercent 
          : (alert.tov && alert.tov > 0 ? (alert.finalGP / alert.tov * 100) : 0);
        
        if (gpPercent === undefined || isNaN(gpPercent)) {
          throw new Error('Alert missing valid gpPercent field');
        }
        
        log(`   Alert structure valid: ${JSON.stringify({
          id: alert.opportunityId || alert.programName,
          tov: alert.tov,
          finalGP: alert.finalGP,
          gpPercent: gpPercent.toFixed(2) + '%'
        })}`, 'info');
      }
    });

    // Print summary
    log('\n' + '='.repeat(80), 'info');
    log('📊 TEST SUMMARY', 'info');
    log(`Total Tests: ${testResults.total}`, 'info');
    log(`✅ Passed: ${testResults.passed}`, 'success');
    log(`❌ Failed: ${testResults.failed}`, testResults.failed > 0 ? 'error' : 'success');

    if (testResults.errors.length > 0) {
      log('\n❌ FAILED TESTS:', 'error');
      testResults.errors.forEach((err, idx) => {
        log(`${idx + 1}. ${err.test}: ${err.error}`, 'error');
      });
    }

    const passRate = ((testResults.passed / testResults.total) * 100).toFixed(2);
    log(`\n📈 Pass Rate: ${passRate}%`, passRate >= 100 ? 'success' : 'warning');

    if (testResults.failed === 0) {
      log('\n🎉 ALL GP POPUP ALERT TESTS PASSED!', 'success');
      log('\n✅ Business Head will see popup for GP < 15%', 'success');
      log('✅ Director will see popup for GP < 10%', 'success');
      log('✅ Popup data structure is correct', 'success');
      process.exit(0);
    } else {
      log('\n⚠️  SOME TESTS FAILED - REVIEW REQUIRED', 'error');
      process.exit(1);
    }
  } catch (error) {
    log(`\n💥 FATAL ERROR: ${error.message}`, 'error');
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

// Run tests
runGPPopupTests();
