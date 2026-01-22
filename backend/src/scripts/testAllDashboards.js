import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../config.env') });

const BASE_URL = 'http://localhost:5000/api';

const credentials = {
  'operations': { email: 'operations@singleplayground.com', password: 'Operations@2026' },
  'business': { email: 'business@singleplayground.com', password: 'Business@2026' },
  'finance': { email: 'finance@singleplayground.com', password: 'Finance@2026' },
  'director': { email: 'director@singleplayground.com', password: 'Director@2026' },
  'sales-executive': { email: 'salesexec@singleplayground.com', password: 'SalesExec@2026' },
  'sales-manager': { email: 'salesmgr@singleplayground.com', password: 'SalesMgr@2026' }
};

const roles = ['operations', 'business', 'finance', 'director', 'sales-executive', 'sales-manager'];

async function testAllDashboards() {
  console.log('\n🧪 Testing All Dashboard Endpoints\n');
  console.log('='.repeat(60));
  
  let passed = 0;
  let failed = 0;
  const errors = [];

  for (const role of roles) {
    try {
      console.log(`\n📊 Testing ${role.toUpperCase()} Dashboard...`);
      
      // Login
      const loginRes = await axios.post(`${BASE_URL}/auth/login`, credentials[role]);
      const token = loginRes.data.token;
      
      if (!token) {
        throw new Error('No token received');
      }
      
      // Test Dashboard
      const dashRes = await axios.get(`${BASE_URL}/dashboards/${role}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Validate response
      if (!dashRes.data || typeof dashRes.data !== 'object') {
        throw new Error('Invalid dashboard response structure');
      }
      
      // Check for required fields based on role
      if (role === 'sales-executive' || role === 'sales-manager' || role === 'business') {
        if (!dashRes.data.pipeline) {
          throw new Error('Pipeline data missing');
        }
        if (dashRes.data.revenueTarget === undefined) {
          throw new Error('Revenue target missing');
        }
      }
      
      // Business Head doesn't show recent opportunities (available in sidebar)
      if (role === 'sales-executive' || role === 'sales-manager') {
        if (!Array.isArray(dashRes.data.recentOpportunities)) {
          throw new Error('Recent opportunities should be an array');
        }
      }
      
      console.log(`   ✅ Status: ${dashRes.status}`);
      console.log(`   ✅ Response keys: ${Object.keys(dashRes.data).join(', ')}`);
      passed++;
      
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      console.log(`   ❌ FAILED: ${errorMsg}`);
      errors.push({ role, error: errorMsg });
      failed++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 TEST SUMMARY');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Success Rate: ${((passed / roles.length) * 100).toFixed(1)}%`);
  
  if (errors.length > 0) {
    console.log('\n❌ ERRORS FOUND:');
    errors.forEach(({ role, error }) => {
      console.log(`   • ${role}: ${error}`);
    });
  }
  
  console.log('\n✅ Dashboard Test Complete!\n');
  
  return { passed, failed, errors };
}

// Run tests
testAllDashboards()
  .then(({ passed, failed }) => {
    process.exit(failed > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
