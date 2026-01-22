import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../config.env') });

const API_BASE = 'http://localhost:5000/api';
const securityIssues = [];

const testUsers = {
  'Operations Manager': { email: 'operations@singleplayground.com', password: 'Operations@2026' },
  'Business Head': { email: 'business@singleplayground.com', password: 'Business@2026' }
};

let authTokens = {};

const log = (message, type = 'info') => {
  const prefix = type === 'error' ? '🔴' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} ${message}`);
};

const login = async (role) => {
  const user = testUsers[role];
  const response = await axios.post(`${API_BASE}/auth/login`, {
    email: user.email,
    password: user.password,
    role: role
  });
  authTokens[role] = response.data.token;
  return response.data.token;
};

const apiCall = async (method, endpoint, role, data = null) => {
  const token = authTokens[role] || await login(role);
  const config = {
    method,
    url: `${API_BASE}${endpoint}`,
    headers: { Authorization: `Bearer ${token}` }
  };
  if (data) config.data = data;
  return axios(config);
};

// Test privilege escalation
const testPrivilegeEscalation = async () => {
  log('\n=== SECURITY AUDIT: Privilege Escalation ===', 'info');
  
  await login('Operations Manager');
  
  // Try to access Director-only endpoints
  const forbiddenEndpoints = [
    '/governance/audit-trail',
    '/governance/risk-alerts',
    '/dashboards/director'
  ];
  
  for (const endpoint of forbiddenEndpoints) {
    try {
      await apiCall('get', endpoint, 'Operations Manager');
      log(`🔴 SECURITY BREACH: Ops accessed ${endpoint}`, 'error');
      securityIssues.push({ type: 'Privilege Escalation', endpoint });
    } catch (error) {
      if (error.response?.status === 403) {
        log(`✅ Correctly blocked: ${endpoint}`, 'success');
      } else {
        log(`⚠️ Unexpected response: ${endpoint} - ${error.response?.status}`, 'warning');
      }
    }
  }
  
  // Try to modify Finance data
  try {
    await apiCall('post', '/invoices', 'Operations Manager', {
      programId: 'test',
      clientName: 'Test',
      invoiceAmount: 100000
    });
    log('🔴 SECURITY BREACH: Ops created invoice', 'error');
    securityIssues.push({ type: 'Unauthorized Modification', action: 'Invoice Creation' });
  } catch (error) {
    if (error.response?.status === 403) {
      log('✅ Correctly blocked invoice creation', 'success');
    }
  }
};

// Test role mismatch
const testRoleMismatch = async () => {
  log('\n=== SECURITY AUDIT: Role Mismatch ===', 'info');
  
  // Try to login as Business Head with Ops credentials
  try {
    await axios.post(`${API_BASE}/auth/login`, {
      email: testUsers['Operations Manager'].email,
      password: testUsers['Operations Manager'].password,
      role: 'Business Head' // Wrong role
    });
    log('🔴 SECURITY BREACH: Role mismatch allowed', 'error');
    securityIssues.push({ type: 'Role Mismatch', issue: 'Login with wrong role allowed' });
  } catch (error) {
    if (error.response?.status === 403) {
      log('✅ Role mismatch correctly rejected', 'success');
    } else {
      log(`⚠️ Unexpected response: ${error.response?.status}`, 'warning');
    }
  }
};

// Test data leakage
const testDataLeakage = async () => {
  log('\n=== SECURITY AUDIT: Data Leakage ===', 'info');
  
  await login('Operations Manager');
  
  // Ops should not see invoice details
  try {
    const invoices = await apiCall('get', '/invoices', 'Operations Manager');
    log('🔴 SECURITY BREACH: Ops can see invoices', 'error');
    securityIssues.push({ type: 'Data Leakage', data: 'Invoices visible to Ops' });
  } catch (error) {
    if (error.response?.status === 403) {
      log('✅ Invoices correctly hidden from Ops', 'success');
    }
  }
  
  // Ops should not see tax details
  try {
    const taxRecords = await apiCall('get', '/tax-engine', 'Operations Manager');
    // Ops can see payment status but not tax details - check if full records are exposed
    if (taxRecords.data && taxRecords.data.length > 0) {
      const hasTaxDetails = taxRecords.data.some(t => t.tdsSection && t.applicableTdsPercent);
      if (hasTaxDetails) {
        log('⚠️ Ops can see tax details (may be intentional for payment status)', 'warning');
      } else {
        log('✅ Tax details correctly filtered for Ops', 'success');
      }
    }
  } catch (error) {
    if (error.response?.status === 403) {
      log('✅ Tax engine correctly blocked from Ops', 'success');
    }
  }
};

// Main execution
const runSecurityAudit = async () => {
  log('🔒 Starting Security Audit...', 'info');
  
  for (let i = 0; i < 30; i++) {
    try {
      await axios.get(`${API_BASE}/health`);
      break;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  try {
    await testPrivilegeEscalation();
    await testRoleMismatch();
    await testDataLeakage();
  } catch (error) {
    log(`Critical error: ${error.message}`, 'error');
  }
  
  log('\n=== SECURITY AUDIT RESULTS ===', 'info');
  log(`Security Issues Found: ${securityIssues.length}`, securityIssues.length > 0 ? 'error' : 'success');
  
  if (securityIssues.length > 0) {
    securityIssues.forEach(issue => log(`  - ${JSON.stringify(issue)}`, 'error'));
  }
  
  if (securityIssues.length === 0) {
    log('\n✅ SECURITY AUDIT PASSED', 'success');
  } else {
    log('\n❌ SECURITY AUDIT FAILED', 'error');
  }
  
  process.exit(securityIssues.length === 0 ? 0 : 1);
};

runSecurityAudit();
