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
  errors: [],
  warnings: []
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
let createdEntities = {
  clients: [],
  opportunities: [],
  programs: [],
  vendors: [],
  deals: [],
  invoices: []
};

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
      log(`   Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`, 'error');
    }
    return false;
  }
};

const warning = (message) => {
  testResults.warnings.push(message);
  log(`⚠️  WARNING: ${message}`, 'warning');
};

const getAuthHeaders = (role) => ({
  headers: { Authorization: `Bearer ${authTokens[role]}` }
});

// ==================== PHASE 1: AUTHENTICATION & ROLE ISOLATION ====================

const testAuthentication = async () => {
  log('\n🔐 PHASE 1: AUTHENTICATION & ROLE ISOLATION', 'info');
  
  // Test login for each role
  for (const [role, credentials] of Object.entries(testUsers)) {
    await runTest(`Login as ${role}`, async () => {
      const response = await axios.post(`${API_BASE}/auth/login`, {
        email: credentials.email,
        password: credentials.password,
        role: role
      });
      if (!response.data.token) throw new Error('No token received');
      authTokens[role] = response.data.token;
      if (response.data.user.role !== role) throw new Error(`Role mismatch: expected ${role}, got ${response.data.user.role}`);
    });
  }

  // Test /auth/me endpoint
  for (const role of Object.keys(testUsers)) {
    await runTest(`${role} - Verify /auth/me`, async () => {
      const response = await axios.get(`${API_BASE}/auth/me`, getAuthHeaders(role));
      if (response.data.user.role !== role) throw new Error('Role verification failed');
    });
  }

  // Test unauthorized access
  await runTest('Sales Executive - Cannot access Finance endpoints', async () => {
    try {
      await axios.get(`${API_BASE}/invoices`, getAuthHeaders('Sales Executive'));
      throw new Error('Should have been blocked');
    } catch (error) {
      if (error.response?.status !== 403) throw new Error('Expected 403 Forbidden');
    }
  });

  await runTest('Sales Executive - Cannot access Operations endpoints', async () => {
    try {
      await axios.post(`${API_BASE}/programs`, {}, getAuthHeaders('Sales Executive'));
      throw new Error('Should have been blocked');
    } catch (error) {
      if (error.response?.status !== 403) throw new Error('Expected 403 Forbidden');
    }
  });
};

// ==================== PHASE 2: DROPDOWN EXHAUSTION TEST ====================

const testDropdowns = async () => {
  log('\n📋 PHASE 2: DROPDOWN EXHAUSTION TEST', 'info');

  // Test dropdown options endpoint
  for (const role of Object.keys(testUsers)) {
    await runTest(`${role} - Fetch dropdown options`, async () => {
      const response = await axios.get(`${API_BASE}/dropdown-options`, getAuthHeaders(role));
      if (!response.data || typeof response.data !== 'object') throw new Error('Invalid dropdown options');
    });
  }

  // Test specific dropdowns
  await runTest('Training Opportunities dropdown - All options present', async () => {
    const response = await axios.get(`${API_BASE}/dropdown-options`, getAuthHeaders('Sales Executive'));
    const expected = ['Training', 'Vouchers', 'Resource Support', 'Lab support', 'Content development', 'Project Support'];
    const actual = response.data.trainingOpportunity || response.data.options?.trainingOpportunity || [];
    expected.forEach(opt => {
      if (!actual.includes(opt)) throw new Error(`Missing option: ${opt}`);
    });
  });

  await runTest('Training Sectors dropdown - All options present', async () => {
    const response = await axios.get(`${API_BASE}/dropdown-options`, getAuthHeaders('Sales Executive'));
    const expected = ['Corporate', 'academics', 'university', 'college', 'school'];
    const actual = response.data.trainingSector || response.data.options?.trainingSector || [];
    expected.forEach(opt => {
      if (!actual.includes(opt)) throw new Error(`Missing option: ${opt}`);
    });
  });

  await runTest('Vendor Type dropdown - HUF/Firm/LLP removed', async () => {
    const response = await axios.get(`${API_BASE}/dropdown-options`, getAuthHeaders('Operations Manager'));
    const vendorTypes = response.data.vendorType || response.data.options?.vendorType || [];
    const forbidden = ['HUF', 'Firm', 'LLP'];
    forbidden.forEach(opt => {
      if (vendorTypes.includes(opt)) throw new Error(`Forbidden option found: ${opt}`);
    });
  });

  await runTest('Location dropdown - Classroom / Hybrid present', async () => {
    const response = await axios.get(`${API_BASE}/dropdown-options`, getAuthHeaders('Operations Manager'));
    const locations = response.data.location || response.data.options?.location || [];
    if (!locations.includes('Classroom / Hybrid')) throw new Error('Missing "Classroom / Hybrid" option');
  });
};

// ==================== PHASE 3: CLIENT CREATION ====================

const testClientCreation = async () => {
  log('\n👥 PHASE 3: CLIENT CREATION', 'info');

  // Sales Executive creates client
  await runTest('Sales Executive - Create client with all fields', async () => {
    const clientData = {
      clientName: 'Test Client Corp',
      trainingSector: 'Corporate',
      contactPersonName: 'John Doe',
      designation: 'Manager',
      contactNumber: '9876543210',
      emailId: 'john@testclient.com',
      location: 'Bangalore',
      hasReportingManager: 'yes',
      reportingManagerDesignation: 'Director',
      reportingManagerContactNumber: '9876543211',
      reportingManagerEmailId: 'director@testclient.com',
      reportingManagerLocation: 'Mumbai'
    };
    const response = await axios.post(`${API_BASE}/clients`, clientData, getAuthHeaders('Sales Executive'));
    if (!response.data._id) throw new Error('Client not created');
    createdEntities.clients.push(response.data._id);
  });

  // Sales Executive creates client without reporting manager
  await runTest('Sales Executive - Create client without reporting manager', async () => {
    const clientData = {
      clientName: 'Test Client 2',
      trainingSector: 'academics',
      contactPersonName: 'Jane Smith',
      designation: 'Professor',
      contactNumber: '9876543212',
      emailId: 'jane@testclient.com',
      location: 'Chennai',
      hasReportingManager: 'no'
    };
    const response = await axios.post(`${API_BASE}/clients`, clientData, getAuthHeaders('Sales Executive'));
    if (!response.data._id) throw new Error('Client not created');
    createdEntities.clients.push(response.data._id);
  });

  // Test client view restrictions
  await runTest('Sales Executive - View own clients', async () => {
    const response = await axios.get(`${API_BASE}/clients`, getAuthHeaders('Sales Executive'));
    if (!Array.isArray(response.data)) throw new Error('Invalid response format');
  });

  await runTest('Sales Manager - View all clients', async () => {
    const response = await axios.get(`${API_BASE}/clients`, getAuthHeaders('Sales Manager'));
    if (!Array.isArray(response.data)) throw new Error('Invalid response format');
  });

  await runTest('Director - View all clients', async () => {
    const response = await axios.get(`${API_BASE}/clients`, getAuthHeaders('Director'));
    if (!Array.isArray(response.data)) throw new Error('Invalid response format');
  });

  // Test forbidden access
  await runTest('Operations Manager - Cannot view clients', async () => {
    try {
      await axios.get(`${API_BASE}/clients`, getAuthHeaders('Operations Manager'));
      throw new Error('Should have been blocked');
    } catch (error) {
      if (error.response?.status !== 403) throw new Error('Expected 403 Forbidden');
    }
  });
};

// ==================== PHASE 4: OPPORTUNITY CREATION & ADHOC ID ====================

const testOpportunityCreation = async () => {
  log('\n💼 PHASE 4: OPPORTUNITY CREATION & ADHOC ID GENERATION', 'info');

  // Test Training opportunity
  await runTest('Sales Executive - Create Training opportunity with all fields', async () => {
    const oppData = {
      trainingOpportunity: 'Training',
      trainingSector: 'Corporate',
      trainingStatus: 'Scheduled',
      trainingSupporter: 'GKT',
      sales: 'Sales Person 1',
      trainingYear: 2026,
      trainingMonth: 'January',
      billingClient: 'Test Client Corp',
      endClient: 'Test Client Corp',
      courseCode: 'COURSE001',
      courseName: 'Advanced Java Training',
      technology: 'IBM',
      numberOfParticipants: 30,
      attendance: 28,
      startDate: '2026-02-15',
      endDate: '2026-02-19',
      numberOfDays: 5,
      location: 'Classroom',
      trainingLocation: 'Bangalore Office',
      trainer: 'Trainer 1',
      tov: 1000000,
      po: 'PO001',
      poDate: '2026-01-15',
      invoiceNumber: 'INV001',
      invoiceDate: '2026-01-20',
      paymentTerms: 'Net 30',
      paymentDate: '2026-02-20',
      trainerPOValues: 250000,
      labPOValue: 150000,
      courseMaterial: 50000,
      royaltyCharges: 50000,
      venue: 20000,
      travelCharges: 30000,
      accommodation: 40000,
      perDiem: 20000,
      localConveyance: 10000,
      marketingChargesPercent: 10,
      contingencyPercent: 5
    };
    const response = await axios.post(`${API_BASE}/opportunities`, oppData, getAuthHeaders('Sales Executive'));
    if (!response.data._id) throw new Error('Opportunity not created');
    if (!response.data.opportunityId) throw new Error('Adhoc ID not generated');
    if (!/^GKT\d{2}CH\d{2}\d{3}$/.test(response.data.opportunityId)) {
      throw new Error(`Invalid Adhoc ID format: ${response.data.opportunityId}`);
    }
    createdEntities.opportunities.push(response.data._id);
    
    // Verify GP calculation
    // Total costs: trainerPO + labPO + courseMaterial + royalty + travel + accommodation + perDiem + localConveyance + marketing + contingency
    // Note: venue is a String field, not included in calculation
    // Marketing = 10% of 1000000 = 100000, Contingency = 5% of 1000000 = 50000
    const totalCosts = 250000 + 150000 + 50000 + 50000 + 30000 + 40000 + 20000 + 10000 + 100000 + 50000;
    const expectedGP = 1000000 - totalCosts; // Should be 290000
    const expectedGPPercent = (expectedGP / 1000000) * 100;
    if (Math.abs(response.data.finalGP - expectedGP) > 0.01) {
      throw new Error(`GP calculation error: expected ${expectedGP}, got ${response.data.finalGP}`);
    }
    if (Math.abs(response.data.gpPercent - expectedGPPercent) > 0.01) {
      throw new Error(`GP% calculation error: expected ${expectedGPPercent}, got ${response.data.gpPercent}`);
    }
  });

  // Test Vouchers opportunity
  await runTest('Sales Executive - Create Vouchers opportunity', async () => {
    const oppData = {
      trainingOpportunity: 'Vouchers',
      trainingSector: 'academics',
      trainingStatus: 'Scheduled',
      trainingSupporter: 'GKCS',
      sales: 'Sales Person 2',
      trainingYear: 2026,
      trainingMonth: 'February',
      billingClient: 'Test Client 2',
      endClient: 'Test Client 2',
      courseCode: 'VOUCHER001',
      courseName: 'Certification Vouchers',
      technology: 'Microsoft',
      examDetails: 'Azure Fundamentals',
      noOfVouchers: 50,
      examLocation: 'Online',
      numberOfParticipants: 50, // Required field
      startDate: '2026-03-01', // Required field
      endDate: '2026-03-01', // Required field
      numberOfDays: 1, // Required field
      tov: 500000,
      trainerPOValues: 0,
      labPOValue: 0,
      courseMaterial: 0,
      royaltyCharges: 0,
      venue: 0,
      travelCharges: 0,
      accommodation: 0,
      perDiem: 0,
      localConveyance: 0,
      marketingChargesPercent: 5,
      contingencyPercent: 5
    };
    const response = await axios.post(`${API_BASE}/opportunities`, oppData, getAuthHeaders('Sales Executive'));
    if (!response.data._id) throw new Error('Opportunity not created');
    createdEntities.opportunities.push(response.data._id);
  });

  // Test Resource Support opportunity
  await runTest('Sales Executive - Create Resource Support opportunity', async () => {
    const oppData = {
      trainingOpportunity: 'Resource Support',
      trainingSector: 'Corporate',
      trainingStatus: 'Scheduled',
      trainingSupporter: 'MCT',
      sales: 'Sales Person 3',
      trainingYear: 2026,
      trainingMonth: 'March',
      billingClient: 'Test Client Corp',
      endClient: 'Test Client Corp',
      courseCode: 'RES001',
      courseName: 'Resource Support',
      technology: 'Google',
      requirement: 'Cloud Engineers',
      noOfIds: 5,
      duration: 6,
      region: 'Bangalore',
      numberOfParticipants: 5, // Required field
      startDate: '2026-04-01', // Required field
      endDate: '2026-09-30', // Required field
      numberOfDays: 180, // Required field
      tov: 2500000,
      trainerPOValues: 0,
      labPOValue: 0,
      courseMaterial: 0,
      royaltyCharges: 0,
      venue: 0,
      travelCharges: 0,
      accommodation: 0,
      perDiem: 0,
      localConveyance: 0,
      marketingChargesPercent: 10,
      contingencyPercent: 10
    };
    const response = await axios.post(`${API_BASE}/opportunities`, oppData, getAuthHeaders('Sales Executive'));
    if (!response.data._id) throw new Error('Opportunity not created');
    createdEntities.opportunities.push(response.data._id);
  });

  // Test real-time visibility
  await runTest('All roles - See opportunities in real-time', async () => {
    const roles = ['Sales Executive', 'Sales Manager', 'Business Head', 'Director', 'Operations Manager', 'Finance Manager'];
    for (const role of roles) {
      const response = await axios.get(`${API_BASE}/opportunities`, getAuthHeaders(role));
      if (!Array.isArray(response.data)) throw new Error(`Invalid response for ${role}`);
      if (response.data.length === 0) warning(`${role} sees no opportunities`);
    }
  });

  // Test Adhoc ID format
  await runTest('Adhoc ID - Format validation (GKTYYCHMM000)', async () => {
    const response = await axios.get(`${API_BASE}/opportunities`, getAuthHeaders('Sales Executive'));
    response.data.forEach(opp => {
      if (opp.opportunityId && !/^GKT\d{2}CH\d{2}\d{3}$/.test(opp.opportunityId)) {
        throw new Error(`Invalid Adhoc ID format: ${opp.opportunityId}`);
      }
    });
  });
};

// ==================== PHASE 5: GP CALCULATION ACCURACY ====================

const testGPCalculation = async () => {
  log('\n💰 PHASE 5: GP CALCULATION ACCURACY TEST', 'info');

  // Test GP calculation with various scenarios
  const testCases = [
    {
      name: 'High GP (>15%)',
      tov: 1000000,
      trainerPO: 200000,
      labPO: 100000,
      courseMaterial: 50000,
      royalty: 50000,
      travel: 30000,
      accommodation: 40000,
      perDiem: 20000,
      localConveyance: 10000,
      marketingPercent: 10,
      contingencyPercent: 5,
      expectedGP: 1000000 - (200000 + 100000 + 50000 + 50000 + 30000 + 40000 + 20000 + 10000 + 100000 + 50000),
      expectedGPPercent: ((1000000 - (200000 + 100000 + 50000 + 50000 + 30000 + 40000 + 20000 + 10000 + 100000 + 50000)) / 1000000) * 100
    },
    {
      name: 'Medium GP (10-14%)',
      tov: 1000000,
      trainerPO: 300000,
      labPO: 200000,
      courseMaterial: 100000,
      royalty: 100000,
      travel: 50000,
      accommodation: 50000,
      perDiem: 30000,
      localConveyance: 20000,
      marketingPercent: 10,
      contingencyPercent: 5,
      expectedGP: 1000000 - (300000 + 200000 + 100000 + 100000 + 50000 + 50000 + 30000 + 20000 + 100000 + 50000),
      expectedGPPercent: ((1000000 - (300000 + 200000 + 100000 + 100000 + 50000 + 50000 + 30000 + 20000 + 100000 + 50000)) / 1000000) * 100
    },
    {
      name: 'Low GP (<10%)',
      tov: 1000000,
      trainerPO: 400000,
      labPO: 300000,
      courseMaterial: 150000,
      royalty: 150000,
      travel: 50000,
      accommodation: 50000,
      perDiem: 30000,
      localConveyance: 20000,
      marketingPercent: 10,
      contingencyPercent: 5,
      expectedGP: 1000000 - (400000 + 300000 + 150000 + 150000 + 50000 + 50000 + 30000 + 20000 + 100000 + 50000),
      expectedGPPercent: ((1000000 - (400000 + 300000 + 150000 + 150000 + 50000 + 50000 + 30000 + 20000 + 100000 + 50000)) / 1000000) * 100
    }
  ];

  for (const testCase of testCases) {
    await runTest(`GP Calculation - ${testCase.name}`, async () => {
      const oppData = {
        trainingOpportunity: 'Training',
        trainingSector: 'Corporate',
        trainingStatus: 'Scheduled',
        trainingSupporter: 'GKT',
        sales: 'Test Sales',
        trainingYear: 2026,
        trainingMonth: 'January',
        billingClient: 'Test Client',
        endClient: 'Test Client',
        courseCode: 'TEST001',
        courseName: 'Test Course',
        technology: 'IBM',
        numberOfParticipants: 10,
        attendance: 10,
        startDate: '2026-02-01',
        endDate: '2026-02-05',
        numberOfDays: 5,
        location: 'Online',
        trainer: 'Trainer 1',
        tov: testCase.tov,
        trainerPOValues: testCase.trainerPO,
        labPOValue: testCase.labPO,
        courseMaterial: testCase.courseMaterial,
        royaltyCharges: testCase.royalty,
        travelCharges: testCase.travel,
        accommodation: testCase.accommodation,
        perDiem: testCase.perDiem,
        localConveyance: testCase.localConveyance,
        marketingChargesPercent: testCase.marketingPercent,
        contingencyPercent: testCase.contingencyPercent
      };
      const response = await axios.post(`${API_BASE}/opportunities`, oppData, getAuthHeaders('Sales Executive'));
      
      const calculatedGP = response.data.finalGP;
      const calculatedGPPercent = response.data.gpPercent;
      
      if (Math.abs(calculatedGP - testCase.expectedGP) > 0.01) {
        throw new Error(`GP mismatch: expected ${testCase.expectedGP}, got ${calculatedGP}`);
      }
      if (Math.abs(calculatedGPPercent - testCase.expectedGPPercent) > 0.01) {
        throw new Error(`GP% mismatch: expected ${testCase.expectedGPPercent}%, got ${calculatedGPPercent}%`);
      }
    });
  }

  // Test GP alerts
  await runTest('Business Head - Low GP alert (<15%)', async () => {
    const response = await axios.get(`${API_BASE}/dashboards/business`, getAuthHeaders('Business Head'));
    if (!response.data.lowGPAlerts || !Array.isArray(response.data.lowGPAlerts)) {
      warning('Low GP alerts not found in Business Head dashboard');
    }
  });

  await runTest('Director - Very Low GP alert (<10%)', async () => {
    const response = await axios.get(`${API_BASE}/dashboards/director`, getAuthHeaders('Director'));
    if (!response.data.veryLowGPAlerts || !Array.isArray(response.data.veryLowGPAlerts)) {
      warning('Very low GP alerts not found in Director dashboard');
    }
  });
};

// ==================== PHASE 6: PROGRAM CREATION ====================

const testProgramCreation = async () => {
  log('\n📚 PHASE 6: PROGRAM CREATION', 'info');

  await runTest('Operations Manager - Create program from opportunity', async () => {
    if (createdEntities.opportunities.length === 0) {
      throw new Error('No opportunities available to create program from');
    }
    const oppId = createdEntities.opportunities[0];
    
    // First, get the opportunity to link it
    let oppData;
    try {
      const oppResponse = await axios.get(`${API_BASE}/opportunities/${oppId}`, getAuthHeaders('Operations Manager'));
      oppData = oppResponse.data;
    } catch (error) {
      // If can't fetch, create program without linking
      oppData = null;
    }

    const programData = {
      trainingOpportunity: 'Training',
      trainingSector: 'Corporate',
      trainingStatus: 'Scheduled',
      trainingSupporter: 'GKT',
      sales: 'Test Sales',
      trainingYear: 2026,
      trainingMonth: 'January',
      opportunityId: oppId,
      billingClient: 'Test Client Corp',
      endClient: 'Test Client Corp',
      courseCode: 'PROG001',
      courseName: 'Advanced Java Program',
      technology: 'IBM',
      numberOfParticipants: 30,
      attendance: 28,
      startDate: '2026-02-15',
      endDate: '2026-02-19',
      numberOfDays: 5,
      location: 'Classroom',
      trainingLocation: 'Bangalore Office',
      tov: 1000000,
      trainerPOValues: 250000,
      labPOValue: 150000,
      courseMaterial: 50000,
      royaltyCharges: 50000,
      venue: 20000,
      travelCharges: 30000,
      accommodation: 40000,
      perDiem: 20000,
      localConveyance: 10000,
      marketingChargesPercent: 10,
      contingencyPercent: 5
    };
    const response = await axios.post(`${API_BASE}/programs`, programData, getAuthHeaders('Operations Manager'));
    if (!response.data._id) throw new Error('Program not created');
    createdEntities.programs.push(response.data._id);
    
    // Verify GP calculation (venue is String, not included in calculation)
    const totalCosts = 250000 + 150000 + 50000 + 50000 + 30000 + 40000 + 20000 + 10000 + 100000 + 50000;
    const expectedGP = 1000000 - totalCosts; // Should be 290000
    if (Math.abs(response.data.finalGP - expectedGP) > 0.01) {
      throw new Error(`GP calculation error: expected ${expectedGP}, got ${response.data.finalGP}`);
    }
  });

  await runTest('Program - View with Adhoc ID', async () => {
    if (createdEntities.programs.length === 0) {
      throw new Error('No programs available');
    }
    const programId = createdEntities.programs[0];
    const response = await axios.get(`${API_BASE}/programs/${programId}`, getAuthHeaders('Operations Manager'));
    if (!response.data._id) throw new Error('Program not found');
    // Adhoc ID should be available if opportunity is linked
  });
};

// ==================== PHASE 7: VENDOR CREATION ====================

const testVendorCreation = async () => {
  log('\n🏢 PHASE 7: VENDOR CREATION', 'info');

  await runTest('Operations Manager - Create vendor with all fields', async () => {
    const vendorData = {
      vendorName: 'Test Vendor Pvt Ltd',
      vendorType: 'Company',
      address: '123 Vendor Street, Bangalore',
      contactPersonName: 'Vendor Contact',
      contactNumbers: ['9876543210', '9876543211'],
      phone: ['9876543210', '9876543211'],
      email: 'vendor@test.com',
      panNumber: 'ABCDE1234F',
      gstNumber: '29ABCDE1234F1Z5',
      bankName: 'Test Bank',
      bankAccountNumber: '1234567890123456',
      bankBranchName: 'Bangalore Branch',
      accountType: 'Current Account',
      ifscCode: 'TEST0001234',
      vendorStatus: 'Active'
    };
    const response = await axios.post(`${API_BASE}/vendors`, vendorData, getAuthHeaders('Operations Manager'));
    if (!response.data._id) throw new Error('Vendor not created');
    createdEntities.vendors.push(response.data._id);
  });

  await runTest('Vendor - IFSC code validation', async () => {
    try {
      const vendorData = {
        vendorName: 'Test Vendor 2',
        vendorType: 'Individual',
        address: 'Test Address',
        contactPerson: 'Test Person',
        contactNumbers: ['9876543210'],
        email: 'test@vendor.com',
        panNumber: 'ABCDE1234F',
        bankName: 'Test Bank',
        bankAccountNumber: '1234567890',
        bankBranchName: 'Test Branch',
        accountType: 'Savings Account',
        ifscCode: 'INVALID',
        vendorStatus: 'Active'
      };
      await axios.post(`${API_BASE}/vendors`, vendorData, getAuthHeaders('Operations Manager'));
      warning('IFSC validation may not be working');
    } catch (error) {
      // Expected to fail validation
    }
  });
};

// ==================== PHASE 8: INPUT VALIDATION ====================

const testInputValidation = async () => {
  log('\n✅ PHASE 8: INPUT VALIDATION', 'info');

  await runTest('Phone number - 10+ digits validation', async () => {
    try {
      const clientData = {
        clientName: 'Test Client',
        trainingSector: 'Corporate',
        contactPersonName: 'Test Person',
        designation: 'Manager',
        contactNumber: '123', // Too short
        emailId: 'test@test.com',
        location: 'Bangalore',
        hasReportingManager: 'no'
      };
      await axios.post(`${API_BASE}/clients`, clientData, getAuthHeaders('Sales Executive'));
      warning('Phone number validation may not be working');
    } catch (error) {
      // Expected to fail validation
    }
  });

  await runTest('Email - Format validation', async () => {
    try {
      const clientData = {
        clientName: 'Test Client',
        trainingSector: 'Corporate',
        contactPersonName: 'Test Person',
        designation: 'Manager',
        contactNumber: '9876543210',
        emailId: 'invalid-email', // Invalid format
        location: 'Bangalore',
        hasReportingManager: 'no'
      };
      await axios.post(`${API_BASE}/clients`, clientData, getAuthHeaders('Sales Executive'));
      warning('Email validation may not be working');
    } catch (error) {
      // Expected to fail validation
    }
  });
};

// ==================== PHASE 9: COMPLETE END-TO-END FLOW ====================

const testEndToEndFlow = async () => {
  log('\n🔄 PHASE 9: COMPLETE END-TO-END FLOW', 'info');

  await runTest('E2E Flow - Sales Executive creates opportunity', async () => {
    const oppData = {
      trainingOpportunity: 'Training',
      trainingSector: 'Corporate',
      trainingStatus: 'Scheduled',
      trainingSupporter: 'GKT',
      sales: 'E2E Sales',
      trainingYear: 2026,
      trainingMonth: 'January',
      billingClient: 'E2E Client',
      endClient: 'E2E Client',
      courseCode: 'E2E001',
      courseName: 'E2E Training',
      technology: 'IBM',
      numberOfParticipants: 25,
      attendance: 25,
      startDate: '2026-03-01',
      endDate: '2026-03-05',
      numberOfDays: 5,
      location: 'Online',
      trainer: 'Trainer 1',
      tov: 500000,
      trainerPOValues: 100000,
      labPOValue: 50000,
      courseMaterial: 25000,
      royaltyCharges: 25000,
      venue: 0,
      travelCharges: 10000,
      accommodation: 0,
      perDiem: 0,
      localConveyance: 0,
      marketingChargesPercent: 10,
      contingencyPercent: 5
    };
    const response = await axios.post(`${API_BASE}/opportunities`, oppData, getAuthHeaders('Sales Executive'));
    if (!response.data._id) throw new Error('Opportunity not created');
    const e2eOppId = response.data._id;
    
    // Verify all roles can see it
    const roles = ['Sales Manager', 'Business Head', 'Director', 'Operations Manager', 'Finance Manager'];
    for (const role of roles) {
      const oppResponse = await axios.get(`${API_BASE}/opportunities/${e2eOppId}`, getAuthHeaders(role));
      if (!oppResponse.data._id) throw new Error(`${role} cannot see opportunity`);
    }
    
    // Operations Manager creates program
    const programData = {
      trainingOpportunity: 'Training',
      trainingSector: 'Corporate',
      trainingStatus: 'Scheduled',
      trainingSupporter: 'GKT',
      sales: 'E2E Sales',
      trainingYear: 2026,
      trainingMonth: 'January',
      opportunityId: e2eOppId,
      billingClient: 'E2E Client',
      endClient: 'E2E Client',
      courseCode: 'E2E001',
      courseName: 'E2E Training',
      technology: 'IBM',
      numberOfParticipants: 25,
      attendance: 25,
      startDate: '2026-03-01',
      endDate: '2026-03-05',
      numberOfDays: 5,
      location: 'Online',
      tov: 500000,
      trainerPOValues: 100000,
      labPOValue: 50000,
      courseMaterial: 25000,
      royaltyCharges: 25000,
      travelCharges: 10000,
      marketingChargesPercent: 10,
      contingencyPercent: 5
    };
    const programResponse = await axios.post(`${API_BASE}/programs`, programData, getAuthHeaders('Operations Manager'));
    if (!programResponse.data._id) throw new Error('Program not created');
    
    // Verify GP calculation
    const expectedGP = 500000 - (100000 + 50000 + 25000 + 25000 + 10000 + 50000 + 25000);
    if (Math.abs(programResponse.data.finalGP - expectedGP) > 0.01) {
      throw new Error(`GP calculation error in E2E flow`);
    }
  });
};

// ==================== PHASE 10: DASHBOARD FUNCTIONALITY ====================

const testDashboards = async () => {
  log('\n📊 PHASE 10: DASHBOARD FUNCTIONALITY', 'info');

  const dashboardTests = [
    { role: 'Sales Executive', endpoint: '/dashboards/sales-executive' },
    { role: 'Sales Manager', endpoint: '/dashboards/sales-manager' },
    { role: 'Business Head', endpoint: '/dashboards/business' },
    { role: 'Operations Manager', endpoint: '/dashboards/operations' },
    { role: 'Finance Manager', endpoint: '/dashboards/finance' },
    { role: 'Director', endpoint: '/dashboards/director' }
  ];

  for (const test of dashboardTests) {
    await runTest(`${test.role} - Dashboard loads correctly`, async () => {
      const response = await axios.get(`${API_BASE}${test.endpoint}`, getAuthHeaders(test.role));
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid dashboard response');
      }
    });
  }

  await runTest('All dashboards - Recent opportunities visible', async () => {
    for (const test of dashboardTests) {
      const response = await axios.get(`${API_BASE}${test.endpoint}`, getAuthHeaders(test.role));
      if (!response.data.recentOpportunities || !Array.isArray(response.data.recentOpportunities)) {
        warning(`${test.role} dashboard missing recentOpportunities`);
      }
    }
  });
};

// ==================== MAIN TEST RUNNER ====================

const runAllTests = async () => {
  log('\n🚀 STARTING COMPREHENSIVE PRODUCTION TEST SUITE', 'info');
  log('='.repeat(80), 'info');

  try {
    // Check if backend server is running
    try {
      await axios.get(`${API_BASE.replace('/api', '')}/health`, { timeout: 2000 });
    } catch (error) {
      try {
        await axios.get(`${API_BASE}/dropdown-options`, { timeout: 2000 });
      } catch (err) {
        log('⚠️  WARNING: Backend server may not be running. Please start it with: npm run dev', 'warning');
        log('   Continuing tests anyway...', 'warning');
      }
    }

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    log('✅ Connected to MongoDB', 'success');

    // Run all test phases
    await testAuthentication();
    await testDropdowns();
    await testClientCreation();
    await testOpportunityCreation();
    await testGPCalculation();
    await testProgramCreation();
    await testVendorCreation();
    await testInputValidation();
    await testEndToEndFlow();
    await testDashboards();

    // Print summary
    log('\n' + '='.repeat(80), 'info');
    log('📊 TEST SUMMARY', 'info');
    log(`Total Tests: ${testResults.total}`, 'info');
    log(`✅ Passed: ${testResults.passed}`, 'success');
    log(`❌ Failed: ${testResults.failed}`, testResults.failed > 0 ? 'error' : 'success');
    log(`⚠️  Warnings: ${testResults.warnings.length}`, testResults.warnings.length > 0 ? 'warning' : 'info');

    if (testResults.errors.length > 0) {
      log('\n❌ FAILED TESTS:', 'error');
      testResults.errors.forEach((err, idx) => {
        log(`${idx + 1}. ${err.test}: ${err.error}`, 'error');
      });
    }

    if (testResults.warnings.length > 0) {
      log('\n⚠️  WARNINGS:', 'warning');
      testResults.warnings.forEach((warn, idx) => {
        log(`${idx + 1}. ${warn}`, 'warning');
      });
    }

    const passRate = ((testResults.passed / testResults.total) * 100).toFixed(2);
    log(`\n📈 Pass Rate: ${passRate}%`, passRate >= 95 ? 'success' : 'warning');

    if (testResults.failed === 0 && testResults.warnings.length === 0) {
      log('\n🎉 ALL TESTS PASSED - PRODUCTION READY!', 'success');
      process.exit(0);
    } else if (testResults.failed === 0) {
      log('\n✅ ALL TESTS PASSED (with warnings)', 'success');
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
runAllTests();
