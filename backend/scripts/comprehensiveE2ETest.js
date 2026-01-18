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

// Test users (matching seedUsers.js)
const testUsers = {
  'Operations Manager': { email: 'operations@singleplayground.com', password: 'Operations@2026' },
  'Business Head': { email: 'business@singleplayground.com', password: 'Business@2026' },
  'Finance Manager': { email: 'finance@singleplayground.com', password: 'Finance@2026' },
  'Director': { email: 'director@singleplayground.com', password: 'Director@2026' },
  'Sales Executive': { email: 'salesexec@singleplayground.com', password: 'SalesExec@2026' },
  'Sales Manager': { email: 'salesmgr@singleplayground.com', password: 'SalesMgr@2026' }
};

let authTokens = {};

// Helper functions
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

const test = async (name, testFn) => {
  testResults.total++;
  try {
    await testFn();
    testResults.passed++;
    log(`✅ PASS: ${name}`, 'success');
    return true;
  } catch (error) {
    testResults.failed++;
    let errorMsg = 'Unknown error';
    if (error.response) {
      errorMsg = error.response.data?.error || error.response.data?.message || JSON.stringify(error.response.data) || `HTTP ${error.response.status}`;
    } else if (error.message) {
      errorMsg = error.message;
    }
    if (error.stack && errorMsg === error.message) {
      errorMsg += ` (${error.stack.split('\n')[0]})`;
    }
    testResults.errors.push({ test: name, error: errorMsg });
    log(`❌ FAIL: ${name} - ${errorMsg}`, 'error');
    if (error.response?.data) {
      log(`   Response: ${JSON.stringify(error.response.data)}`, 'warning');
    }
    return false;
  }
};

const login = async (role) => {
  const user = testUsers[role];
  if (!user) throw new Error(`No test user for role: ${role}`);
  
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: user.email,
      password: user.password,
      role: role
    }, {
      validateStatus: () => true
    });
    
    if (response.status !== 200) {
      throw new Error(`Login failed: ${response.status} - ${JSON.stringify(response.data)}`);
    }
    
    if (!response.data.token) {
      throw new Error('No token in response');
    }
    
    authTokens[role] = response.data.token;
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`Login error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
};

const apiCall = async (method, endpoint, role, data = null) => {
  const token = authTokens[role];
  if (!token) {
    await login(role);
  }
  
  const config = {
    method,
    url: `${API_BASE}${endpoint}`,
    headers: {
      'Authorization': `Bearer ${authTokens[role]}`,
      'Content-Type': 'application/json'
    },
    validateStatus: () => true // Don't throw on any status
  };
  
  if (data) {
    config.data = data;
  }
  
  const response = await axios(config);
  
  // Check for error status codes
  if (response.status >= 400) {
    const error = new Error(`HTTP ${response.status}: ${response.data?.error || response.statusText}`);
    error.response = response;
    throw error;
  }
  
  return response;
};

// ============================================
// PHASE 1: AUTHENTICATION & ROLE ISOLATION
// ============================================
const testAuthentication = async () => {
  log('\n=== PHASE 1: AUTHENTICATION & ROLE ISOLATION ===', 'info');
  
  for (const role of Object.keys(testUsers)) {
    await test(`Login as ${role}`, async () => {
      const result = await login(role);
      if (!result.token) throw new Error('No token received');
      if (result.user.role !== role) throw new Error(`Role mismatch: expected ${role}, got ${result.user.role}`);
    });
  }
  
  await test('Invalid login credentials', async () => {
    try {
      await axios.post(`${API_BASE}/auth/login`, {
        email: 'invalid@test.com',
        password: 'wrong',
        role: 'Operations Manager'
      });
      throw new Error('Should have failed');
    } catch (error) {
      if (error.response?.status !== 401) throw new Error('Expected 401 error');
    }
  });
};

// ============================================
// PHASE 2: DROPDOWN EXHAUSTION TEST
// ============================================
const testDropdowns = async () => {
  log('\n=== PHASE 2: DROPDOWN & FIELD EXHAUSTION TEST ===', 'info');
  
  await test('Fetch all dropdown options', async () => {
    const response = await apiCall('get', '/dropdown-options', 'Sales Executive');
    const options = response.data;
    
    // Check all required dropdowns exist
    const requiredDropdowns = [
      'trainingOpportunity', 'trainingSector', 'trainingStatus', 
      'trainingSupporter', 'trainingMonth', 'location', 'technology',
      'marketingChargesPercent', 'contingencyPercent'
    ];
    
    for (const dropdown of requiredDropdowns) {
      if (!options[dropdown] || !Array.isArray(options[dropdown])) {
        throw new Error(`Missing or invalid dropdown: ${dropdown}`);
      }
      if (options[dropdown].length === 0) {
        throw new Error(`Empty dropdown: ${dropdown}`);
      }
    }
  });
  
  await test('Training Opportunity dropdown has all options', async () => {
    const response = await apiCall('get', '/dropdown-options', 'Sales Executive');
    const options = response.data.trainingOpportunity;
    const expected = ['Training', 'Vouchers', 'Resource Support', 'Lab support', 'Content development', 'Project Support'];
    
    for (const expectedOption of expected) {
      if (!options.includes(expectedOption)) {
        throw new Error(`Missing option: ${expectedOption}`);
      }
    }
  });
  
  await test('Location dropdown includes Classroom / Hybrid', async () => {
    const response = await apiCall('get', '/dropdown-options', 'Operations Manager');
    const options = response.data.location;
    if (!options.includes('Classroom / Hybrid')) {
      throw new Error('Missing "Classroom / Hybrid" option');
    }
  });
};

// ============================================
// PHASE 3: CLIENT CREATION & VALIDATION
// ============================================
const testClientCreation = async () => {
  log('\n=== PHASE 3: CLIENT CREATION & VALIDATION ===', 'info');
  
  let clientId;
  
  await test('Sales Executive creates client', async () => {
    const clientData = {
      clientName: 'Test Client E2E',
      trainingSector: 'Corporate',
      contactPersonName: 'John Doe',
      designation: 'Manager',
      contactNumber: '9876543210',
      emailId: 'john.doe@testclient.com',
      location: 'Bangalore',
      hasReportingManager: false
    };
    
    const response = await apiCall('post', '/clients', 'Sales Executive', clientData);
    if (!response.data._id) throw new Error('Client not created');
    clientId = response.data._id;
  });
  
  await test('Sales Executive views own client', async () => {
    if (!clientId) {
      throw new Error('Client ID not set from previous test');
    }
    const response = await apiCall('get', `/clients/${clientId}`, 'Sales Executive');
    if (response.data.clientName !== 'Test Client E2E') {
      throw new Error(`Client data mismatch: Expected 'Test Client E2E', got '${response.data.clientName}'`);
    }
  });
  
  await test('Sales Manager views all clients', async () => {
    const response = await apiCall('get', '/clients', 'Sales Manager');
    if (!Array.isArray(response.data)) throw new Error('Expected array');
    if (response.data.length === 0) throw new Error('No clients found');
  });
  
  await test('Director views clients (read-only)', async () => {
    const response = await apiCall('get', '/clients', 'Director');
    if (!Array.isArray(response.data)) throw new Error('Expected array');
  });
  
  await test('Operations Manager cannot access clients', async () => {
    try {
      await apiCall('get', '/clients', 'Operations Manager');
      throw new Error('Should have been blocked');
    } catch (error) {
      if (error.response?.status !== 403) throw new Error('Expected 403 error');
    }
  });
};

// ============================================
// PHASE 4: OPPORTUNITY CREATION & ID GENERATION
// ============================================
const testOpportunityCreation = async () => {
  log('\n=== PHASE 4: OPPORTUNITY CREATION & ID GENERATION ===', 'info');
  
  let opportunityId;
  let opportunityObjId;
  
  await test('Sales Executive creates opportunity with Training type', async () => {
    const oppData = {
      trainingOpportunity: 'Training',
      trainingSector: 'Corporate',
      trainingStatus: 'Scheduled',
      trainingSupporter: 'GKT',
      sales: 'Sales Team',
      trainingYear: 2026,
      trainingMonth: 'January',
      billingClient: 'Test Client E2E',
      endClient: 'Test Client E2E',
      courseCode: 'TEST001',
      courseName: 'Test Training Course',
      technology: 'IBM',
      numberOfParticipants: 25,
      attendance: 0,
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-02-05'),
      numberOfDays: 5,
      location: 'Classroom',
      trainingLocation: 'Bangalore Office',
      tov: 100000,
      trainerPOValues: 20000,
      labPOValue: 10000,
      courseMaterial: 5000,
      royaltyCharges: 2000,
      venue: 5000,
      travelCharges: 3000,
      accommodation: 4000,
      perDiem: 2000,
      localConveyance: 1000,
      marketingChargesPercent: 10,
      contingencyPercent: 5
    };
    
    const response = await apiCall('post', '/opportunities', 'Sales Executive', oppData);
    if (!response.data.opportunityId) throw new Error('Adhoc ID not generated');
    
    // Verify ID format: GKTYYCHMM000 (12 characters)
    const id = response.data.opportunityId;
    if (id.length !== 12) throw new Error(`Invalid ID length: ${id.length}, expected 12`);
    if (!id.startsWith('GKT')) throw new Error(`ID should start with GKT: ${id}`);
    if (!id.includes('CH')) throw new Error(`ID should contain CH: ${id}`);
    
    opportunityId = response.data.opportunityId;
    opportunityObjId = response.data._id;
  });
  
  await test('Verify Adhoc ID format (GKTYYCHMM000)', async () => {
    const pattern = /^GKT\d{2}CH\d{2}\d{3}$/;
    if (!pattern.test(opportunityId)) {
      throw new Error(`Invalid ID format: ${opportunityId}`);
    }
  });
  
  await test('All roles can view created opportunity', async () => {
    const roles = ['Sales Executive', 'Sales Manager', 'Business Head', 'Director', 'Operations Manager', 'Finance Manager'];
    
    for (const role of roles) {
      const response = await apiCall('get', `/opportunities/${opportunityObjId}`, role);
      if (response.data.opportunityId !== opportunityId) {
        throw new Error(`Role ${role} cannot view opportunity`);
      }
    }
  });
  
  await test('Sales Executive creates opportunity with Vouchers type', async () => {
    const oppData = {
      trainingOpportunity: 'Vouchers',
      trainingSector: 'academics',
      trainingStatus: 'Scheduled',
      trainingSupporter: 'GKCS',
      trainingYear: 2026,
      trainingMonth: 'February',
      billingClient: 'Test Client Vouchers',
      endClient: 'Test Client Vouchers',
      courseCode: 'VOUCH001',
      courseName: 'Voucher Test',
      technology: 'Microsoft',
      examDetails: 'Azure Fundamentals Exam',
      noOfVouchers: 50,
      numberOfParticipants: 50, // For expectedParticipants requirement
      examLocation: 'North',
      examRegions: [
        { region: 'North', numberOfExams: 30 },
        { region: 'South', numberOfExams: 20 }
      ],
      tov: 50000,
      numberOfDays: 1,
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-03-01')
    };
    
    const response = await apiCall('post', '/opportunities', 'Sales Executive', oppData);
    if (!response.data.opportunityId) throw new Error('Adhoc ID not generated');
  });
  
  await test('Sales Executive creates opportunity with Resource Support type', async () => {
    const oppData = {
      trainingOpportunity: 'Resource Support',
      trainingSector: 'university',
      trainingStatus: 'Scheduled',
      trainingSupporter: 'GKT',
      trainingYear: 2026,
      trainingMonth: 'March',
      billingClient: 'Test Client Resource',
      endClient: 'Test Client Resource',
      courseCode: 'RES001',
      courseName: 'Resource Support Test',
      technology: 'Google',
      requirement: 'Need 5 cloud engineers for 3 months',
      noOfIds: 5,
      numberOfParticipants: 5, // For expectedParticipants requirement
      duration: '3 months',
      region: 'South',
      tov: 750000,
      numberOfDays: 90,
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-06-30')
    };
    
    const response = await apiCall('post', '/opportunities', 'Sales Executive', oppData);
    if (!response.data.opportunityId) throw new Error('Adhoc ID not generated');
  });
};

// ============================================
// PHASE 5: GP CALCULATION ACCURACY TEST
// ============================================
const testGPCalculation = async () => {
  log('\n=== PHASE 5: GP CALCULATION ACCURACY TEST ===', 'info');
  
  await test('GP calculation with all cost components', async () => {
    const tov = 1000000;
    const trainerPO = 200000;
    const labPO = 100000;
    const courseMaterial = 50000;
    const royaltyCharges = 20000;
    const travelCharges = 30000;
    const accommodation = 40000;
    const perDiem = 20000;
    const localConveyance = 10000;
    const marketingPercent = 10;
    const contingencyPercent = 5;
    
    const marketingAmount = (tov * marketingPercent) / 100; // 100000
    const contingencyAmount = (tov * contingencyPercent) / 100; // 50000
    
    const totalCosts = trainerPO + labPO + courseMaterial + royaltyCharges + 
                      travelCharges + accommodation + perDiem + localConveyance + 
                      marketingAmount + contingencyAmount;
    
    const expectedGP = tov - totalCosts; // 1000000 - 520000 = 480000
    
    const oppData = {
      trainingOpportunity: 'Training',
      trainingSector: 'Corporate',
      trainingStatus: 'Scheduled',
      trainingSupporter: 'GKT',
      courseName: 'GP Test Course',
      technology: 'IBM',
      numberOfParticipants: 30,
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-03-05'),
      numberOfDays: 5,
      location: 'Online',
      trainingYear: 2026,
      trainingMonth: 'March',
      billingClient: 'GP Test Client',
      endClient: 'GP Test Client',
      courseCode: 'GP001',
      courseName: 'GP Test Course',
      tov: tov,
      trainerPOValues: trainerPO,
      labPOValue: labPO,
      courseMaterial: courseMaterial,
      royaltyCharges: royaltyCharges,
      travelCharges: travelCharges,
      accommodation: accommodation,
      perDiem: perDiem,
      localConveyance: localConveyance,
      marketingChargesPercent: marketingPercent,
      contingencyPercent: contingencyPercent
    };
    
    const response = await apiCall('post', '/opportunities', 'Sales Executive', oppData);
    const calculatedGP = response.data.finalGP;
    
    // Allow small rounding difference (0.01)
    if (Math.abs(calculatedGP - expectedGP) > 0.01) {
      throw new Error(`GP calculation error: Expected ${expectedGP}, Got ${calculatedGP}, Difference: ${Math.abs(calculatedGP - expectedGP)}`);
    }
  });
  
  await test('GP calculation with zero costs', async () => {
    const tov = 500000;
    const oppData = {
      trainingOpportunity: 'Training',
      trainingSector: 'Corporate',
      trainingStatus: 'Scheduled',
      trainingSupporter: 'GKT',
      courseName: 'Zero Cost Test',
      technology: 'IBM',
      numberOfParticipants: 10,
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-04-02'),
      numberOfDays: 2,
      location: 'Online',
      trainingYear: 2026,
      trainingMonth: 'April',
      billingClient: 'Zero Cost Client',
      endClient: 'Zero Cost Client',
      courseCode: 'ZERO001',
      courseName: 'Zero Cost Test',
      tov: tov,
      trainerPOValues: 0,
      labPOValue: 0,
      courseMaterial: 0,
      royaltyCharges: 0,
      travelCharges: 0,
      accommodation: 0,
      perDiem: 0,
      localConveyance: 0,
      marketingChargesPercent: 0,
      contingencyPercent: 0
    };
    
    const response = await apiCall('post', '/opportunities', 'Sales Executive', oppData);
    if (Math.abs(response.data.finalGP - tov) > 0.01) {
      throw new Error(`GP should equal TOV when costs are zero: Expected ${tov}, Got ${response.data.finalGP}`);
    }
  });
  
  await test('GP calculation edge case - negative GP (loss)', async () => {
    const tov = 100000;
    const oppData = {
      trainingOpportunity: 'Training',
      trainingSector: 'Corporate',
      trainingStatus: 'Scheduled',
      trainingSupporter: 'GKT',
      courseName: 'Loss Test',
      technology: 'IBM',
      numberOfParticipants: 10,
      startDate: new Date('2026-05-01'),
      endDate: new Date('2026-05-02'),
      numberOfDays: 2,
      location: 'Online',
      trainingYear: 2026,
      trainingMonth: 'May',
      billingClient: 'Loss Test Client',
      endClient: 'Loss Test Client',
      courseCode: 'LOSS001',
      courseName: 'Loss Test',
      tov: tov,
      trainerPOValues: 50000,
      labPOValue: 30000,
      courseMaterial: 20000,
      royaltyCharges: 10000,
      travelCharges: 5000,
      accommodation: 5000,
      perDiem: 5000,
      localConveyance: 5000,
      marketingChargesPercent: 10,
      contingencyPercent: 5
    };
    
    const response = await apiCall('post', '/opportunities', 'Sales Executive', oppData);
    const expectedGP = tov - (50000 + 30000 + 20000 + 10000 + 5000 + 5000 + 5000 + 5000 + 10000 + 5000); // -125000
    
    if (Math.abs(response.data.finalGP - expectedGP) > 0.01) {
      throw new Error(`Negative GP calculation error: Expected ${expectedGP}, Got ${response.data.finalGP}`);
    }
  });
};

// ============================================
// PHASE 6: VENDOR VALIDATION TEST
// ============================================
const testVendorValidation = async () => {
  log('\n=== PHASE 6: VENDOR VALIDATION TEST ===', 'info');
  
  await test('IFSC code validation - correct format', async () => {
    const vendorData = {
      vendorType: 'Company',
      vendorName: 'Test Vendor IFSC',
      address: '123 Test St',
      contactPersonName: 'Test Person',
      phone: ['9876543210'],
      email: 'vendor@test.com',
      panNumber: 'ABCDE1234F',
      gstNumber: '27ABCDE1234F1Z5',
      bankName: 'Test Bank',
      bankAccountNumber: '1234567890123456',
      ifscCode: 'HDFC0001234',
      accountType: 'Current Account'
    };
    
    const response = await apiCall('post', '/vendors', 'Operations Manager', vendorData);
    if (!response.data._id) throw new Error('Vendor not created');
  });
  
  await test('IFSC code validation - invalid format', async () => {
    const vendorData = {
      vendorType: 'Company',
      vendorName: 'Test Vendor Invalid',
      address: '123 Test St',
      contactPersonName: 'Test Person',
      phone: ['9876543210'],
      email: 'vendor2@test.com',
      panNumber: 'ABCDE1234G',
      gstNumber: '27ABCDE1234G1Z5',
      bankName: 'Test Bank',
      bankAccountNumber: '1234567890123457',
      ifscCode: 'INVALID123', // Invalid format
      accountType: 'Current Account'
    };
    
    try {
      await apiCall('post', '/vendors', 'Operations Manager', vendorData);
      throw new Error('Should have failed validation');
    } catch (error) {
      if (error.response?.status !== 500 && !error.response?.data?.error?.includes('IFSC')) {
        throw new Error('Expected IFSC validation error');
      }
    }
  });
  
  await test('Bank account number validation - correct format', async () => {
    const vendorData = {
      vendorType: 'Individual',
      vendorName: 'Test Vendor Account',
      address: '123 Test St',
      contactPersonName: 'Test Person',
      phone: ['9876543210'],
      email: 'vendor3@test.com',
      panNumber: 'ABCDE1234H',
      bankName: 'Test Bank',
      bankAccountNumber: '123456789', // 9 digits
      ifscCode: 'HDFC0001235',
      accountType: 'Savings Account'
    };
    
    const response = await apiCall('post', '/vendors', 'Operations Manager', vendorData);
    if (!response.data._id) throw new Error('Vendor not created');
  });
  
  await test('Bank account number validation - invalid format', async () => {
    const vendorData = {
      vendorType: 'Individual',
      vendorName: 'Test Vendor Invalid Account',
      address: '123 Test St',
      contactPersonName: 'Test Person',
      phone: ['9876543210'],
      email: 'vendor4@test.com',
      panNumber: 'ABCDE1234I',
      bankName: 'Test Bank',
      bankAccountNumber: '12345', // Too short
      ifscCode: 'HDFC0001236',
      accountType: 'Savings Account'
    };
    
    try {
      await apiCall('post', '/vendors', 'Operations Manager', vendorData);
      throw new Error('Should have failed validation');
    } catch (error) {
      if (error.response?.status !== 500 && !error.response?.data?.error?.includes('account number')) {
        throw new Error('Expected bank account validation error');
      }
    }
  });
};

// ============================================
// PHASE 7: COMPLETE END-TO-END FLOW
// ============================================
const testCompleteFlow = async () => {
  log('\n=== PHASE 7: COMPLETE END-TO-END FLOW ===', 'info');
  
  let clientId, opportunityId, opportunityObjId, dealId, poId;
  
  await test('Step 1: Sales Executive creates client', async () => {
    const clientData = {
      clientName: 'E2E Flow Client',
      trainingSector: 'Corporate',
      contactPersonName: 'Flow Test',
      designation: 'Director',
      contactNumber: '9876543210',
      emailId: 'flow@testclient.com',
      location: 'Mumbai'
    };
    
    const response = await apiCall('post', '/clients', 'Sales Executive', clientData);
    clientId = response.data._id;
  });
  
  await test('Step 2: Sales Executive creates opportunity', async () => {
    const oppData = {
      trainingOpportunity: 'Training',
      trainingSector: 'Corporate',
      trainingStatus: 'Scheduled',
      trainingSupporter: 'GKT',
      billingClient: 'E2E Flow Client',
      endClient: 'E2E Flow Client',
      courseName: 'E2E Test Course',
      technology: 'IBM',
      numberOfParticipants: 20,
      startDate: '2026-06-01',
      endDate: '2026-06-05',
      numberOfDays: 5,
      location: 'Classroom',
      trainingLocation: 'Mumbai Office',
      tov: 500000,
      trainerPOValues: 100000,
      labPOValue: 50000,
      courseMaterial: 25000,
      royaltyCharges: 10000,
      travelCharges: 15000,
      accommodation: 20000,
      perDiem: 10000,
      localConveyance: 5000,
      marketingChargesPercent: 10,
      contingencyPercent: 5
    };
    
    const response = await apiCall('post', '/opportunities', 'Sales Executive', oppData);
    opportunityId = response.data.opportunityId;
    opportunityObjId = response.data._id;
    
    // Verify GP calculation
    const expectedGP = 500000 - (100000 + 50000 + 25000 + 10000 + 15000 + 20000 + 10000 + 5000 + 50000 + 25000);
    if (Math.abs(response.data.finalGP - expectedGP) > 0.01) {
      throw new Error(`GP calculation error in flow: Expected ${expectedGP}, Got ${response.data.finalGP}`);
    }
  });
  
  await test('Step 3: All roles see opportunity in real-time', async () => {
    const roles = ['Sales Executive', 'Sales Manager', 'Business Head', 'Director', 'Operations Manager', 'Finance Manager'];
    
    for (const role of roles) {
      const response = await apiCall('get', '/opportunities', role);
      const found = response.data.find(opp => opp.opportunityId === opportunityId);
      if (!found) {
        throw new Error(`Role ${role} cannot see opportunity`);
      }
    }
  });
  
  await test('Step 4: Operations Manager creates vendor', async () => {
    const vendorData = {
      vendorType: 'Company',
      vendorName: 'E2E Test Vendor',
      address: 'Test Address',
      contactPersonName: 'Vendor Contact',
      phone: ['9876543210'],
      email: 'vendor@e2etest.com',
      panNumber: 'E2ETEST123',
      gstNumber: '27E2ETEST123F1Z5',
      bankName: 'Test Bank E2E',
      bankAccountNumber: '1234567890123456',
      ifscCode: 'HDFC0001237',
      accountType: 'Current Account'
    };
    
    const response = await apiCall('post', '/vendors', 'Operations Manager', vendorData);
    if (!response.data._id) throw new Error('Vendor not created');
  });
  
  await test('Step 5: Operations Manager creates program', async () => {
    const programData = {
      trainingOpportunity: 'Training',
      trainingSector: 'Corporate',
      trainingStatus: 'Scheduled',
      trainingSupporter: 'GKT',
      trainingYear: 2026,
      trainingMonth: 'June',
      billingClient: 'E2E Flow Client',
      endClient: 'E2E Flow Client',
      courseCode: 'E2EPROG001',
      courseName: 'E2E Program',
      technology: 'IBM',
      numberOfParticipants: 20,
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-06-05'),
      numberOfDays: 5,
      location: 'Classroom',
      trainingLocation: 'Mumbai Office',
      tov: 500000,
      trainerPOValues: 100000,
      labPOValue: 50000,
      courseMaterial: 25000,
      royaltyCharges: 10000,
      travelCharges: 15000,
      accommodation: 20000,
      perDiem: 10000,
      localConveyance: 5000,
      marketingChargesPercent: 10,
      contingencyPercent: 5
    };
    
    const response = await apiCall('post', '/programs', 'Operations Manager', programData);
    if (!response.data._id) throw new Error('Program not created');
    
    // Verify GP calculation
    const expectedGP = 500000 - (100000 + 50000 + 25000 + 10000 + 15000 + 20000 + 10000 + 5000 + 50000 + 25000);
    if (Math.abs(response.data.finalGP - expectedGP) > 0.01) {
      throw new Error(`Program GP calculation error: Expected ${expectedGP}, Got ${response.data.finalGP}`);
    }
  });
};

// ============================================
// PHASE 8: FIELD VALIDATION & EDGE CASES
// ============================================
const testFieldValidation = async () => {
  log('\n=== PHASE 8: FIELD VALIDATION & EDGE CASES ===', 'info');
  
  await test('Phone number accepts 10+ digits', async () => {
    const clientData = {
      clientName: 'Long Phone Test',
      trainingSector: 'Corporate',
      contactPersonName: 'Test',
      designation: 'Manager',
      contactNumber: '987654321012345', // 15 digits
      emailId: 'longphone@test.com',
      location: 'Test'
    };
    
    const response = await apiCall('post', '/clients', 'Sales Executive', clientData);
    if (response.data.contactNumber !== '987654321012345') {
      throw new Error('Long phone number not accepted');
    }
  });
  
  await test('Email accepts Gmail format', async () => {
    const clientData = {
      clientName: 'Gmail Test',
      trainingSector: 'Corporate',
      contactPersonName: 'Test',
      designation: 'Manager',
      contactNumber: '9876543210',
      emailId: 'test.user+tag@gmail.com',
      location: 'Test'
    };
    
    const response = await apiCall('post', '/clients', 'Sales Executive', clientData);
    if (response.data.emailId !== 'test.user+tag@gmail.com') {
      throw new Error('Gmail email not accepted');
    }
  });
  
  await test('Number of days is manual (not auto-calculated)', async () => {
    const oppData = {
      trainingOpportunity: 'Training',
      trainingSector: 'Corporate',
      trainingStatus: 'Scheduled',
      trainingSupporter: 'GKT',
      courseName: 'Manual Days Test',
      technology: 'IBM',
      numberOfParticipants: 10,
      startDate: new Date('2026-07-01'),
      endDate: new Date('2026-07-10'), // 10 days difference
      numberOfDays: 3, // Manual entry, different from date diff
      location: 'Online',
      trainingYear: 2026,
      trainingMonth: 'July',
      billingClient: 'Manual Days Client',
      endClient: 'Manual Days Client',
      courseCode: 'MANUAL001',
      courseName: 'Manual Days Test',
      trainingSupporter: 'GKT',
      tov: 100000
    };
    
    const response = await apiCall('post', '/opportunities', 'Sales Executive', oppData);
    if (response.data.numberOfDays !== 3) {
      throw new Error('Number of days should be manual, not auto-calculated');
    }
  });
  
  await test('Training Location appears for Classroom / Hybrid', async () => {
    const oppData = {
      trainingOpportunity: 'Training',
      trainingSector: 'Corporate',
      trainingStatus: 'Scheduled',
      trainingSupporter: 'GKT',
      courseName: 'Location Test',
      technology: 'IBM',
      numberOfParticipants: 10,
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-08-02'),
      numberOfDays: 2,
      location: 'Classroom / Hybrid',
      trainingLocation: 'Test Location Address',
      trainingYear: 2026,
      trainingMonth: 'August',
      billingClient: 'Location Test Client',
      endClient: 'Location Test Client',
      courseCode: 'LOC001',
      courseName: 'Location Test',
      trainingSupporter: 'GKT',
      tov: 100000
    };
    
    const response = await apiCall('post', '/opportunities', 'Sales Executive', oppData);
    if (!response.data.trainingLocation) {
      throw new Error('Training location should be saved');
    }
  });
};

// ============================================
// PHASE 9: ROLE-BASED ACCESS CONTROL
// ============================================
const testRoleAccess = async () => {
  log('\n=== PHASE 9: ROLE-BASED ACCESS CONTROL ===', 'info');
  
  await test('Sales Executive cannot access Finance modules', async () => {
    try {
      await apiCall('get', '/invoices', 'Sales Executive');
      throw new Error('Should have been blocked');
    } catch (error) {
      if (error.response?.status !== 403) throw new Error('Expected 403 error');
    }
  });
  
  await test('Sales Manager cannot access Finance modules', async () => {
    try {
      await apiCall('get', '/invoices', 'Sales Manager');
      throw new Error('Should have been blocked');
    } catch (error) {
      if (error.response?.status !== 403) throw new Error('Expected 403 error');
    }
  });
  
  await test('Operations Manager cannot access Deals', async () => {
    try {
      await apiCall('get', '/deals', 'Operations Manager');
      throw new Error('Should have been blocked');
    } catch (error) {
      if (error.response?.status !== 403) throw new Error('Expected 403 error');
    }
  });
  
  await test('Finance Manager cannot edit opportunities', async () => {
    // First create an opportunity
    const oppData = {
      trainingOpportunity: 'Training',
      trainingSector: 'Corporate',
      trainingStatus: 'Scheduled',
      trainingSupporter: 'GKT',
      courseName: 'Finance Edit Test',
      technology: 'IBM',
      numberOfParticipants: 10,
      startDate: new Date('2026-09-01'),
      endDate: new Date('2026-09-02'),
      numberOfDays: 2,
      location: 'Online',
      trainingYear: 2026,
      trainingMonth: 'September',
      billingClient: 'Finance Edit Test Client',
      endClient: 'Finance Edit Test Client',
      courseCode: 'FIN001',
      courseName: 'Finance Edit Test',
      trainingSupporter: 'GKT',
      tov: 100000
    };
    
    const createResponse = await apiCall('post', '/opportunities', 'Sales Executive', oppData);
    const oppId = createResponse.data._id;
    
    // Try to edit as Finance Manager
    try {
      await apiCall('put', `/opportunities/${oppId}`, 'Finance Manager', { courseName: 'Modified' });
      throw new Error('Should have been blocked');
    } catch (error) {
      if (error.response?.status !== 403) throw new Error('Expected 403 error');
    }
  });
};

// ============================================
// MAIN TEST RUNNER
// ============================================
const runAllTests = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'GKT-ERP' });
    log('Connected to MongoDB', 'success');
    
    // Run all test phases
    await testAuthentication();
    await testDropdowns();
    await testClientCreation();
    await testOpportunityCreation();
    await testGPCalculation();
    await testVendorValidation();
    await testFieldValidation();
    await testRoleAccess();
    await testCompleteFlow();
    
    // Print summary
    log('\n' + '='.repeat(60), 'info');
    log('TEST SUMMARY', 'info');
    log('='.repeat(60), 'info');
    log(`Total Tests: ${testResults.total}`, 'info');
    log(`Passed: ${testResults.passed}`, 'success');
    log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'error' : 'success');
    
    if (testResults.errors.length > 0) {
      log('\nFAILED TESTS:', 'error');
      testResults.errors.forEach(({ test, error }) => {
        log(`  - ${test}: ${error}`, 'error');
      });
    }
    
    log('\n' + '='.repeat(60), 'info');
    
    if (testResults.failed === 0) {
      log('✅ ALL TESTS PASSED - SYSTEM IS PRODUCTION READY', 'success');
      process.exit(0);
    } else {
      log('❌ SOME TESTS FAILED - REVIEW ERRORS ABOVE', 'error');
      process.exit(1);
    }
  } catch (error) {
    log(`Fatal error: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

// Run tests
runAllTests();
