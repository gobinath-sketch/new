import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function testFinanceEndpoints() {
  console.log('=== Testing Finance Manager Endpoints ===\n');

  try {
    // Login as Finance Manager
    console.log('1. Logging in as Finance Manager...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'finance@singleplayground.com',
      password: 'Finance@2026'
    });
    const token = loginRes.data.token;
    console.log('   ✓ Login successful');

    const headers = { Authorization: `Bearer ${token}` };

    // Test main finance dashboard
    console.log('\n2. Testing /dashboards/finance...');
    const financeRes = await axios.get(`${BASE_URL}/dashboards/finance`, { headers });
    console.log('   ✓ Finance dashboard response:', {
      totalRevenue: financeRes.data.totalRevenue,
      totalExpenses: financeRes.data.totalExpenses,
      grossProfit: financeRes.data.grossProfit,
      gpPercent: financeRes.data.gpPercent?.toFixed(2) + '%',
      totalOpportunities: financeRes.data.totalOpportunities,
      cashPosition: financeRes.data.cashPosition,
      pendingInvoices: financeRes.data.pendingInvoices?.length || 0,
      overdueReceivables: financeRes.data.overdueReceivables?.length || 0
    });

    // Test client GP endpoint
    console.log('\n3. Testing /dashboards/finance/client-gp...');
    const clientGPRes = await axios.get(`${BASE_URL}/dashboards/finance/client-gp`, { headers });
    console.log('   ✓ Client GP data:', clientGPRes.data.clientData?.length || 0, 'clients');
    if (clientGPRes.data.clientData?.length > 0) {
      console.log('   Sample:', clientGPRes.data.clientData[0]);
    }

    // Test vendor expenses endpoint
    console.log('\n4. Testing /dashboards/finance/vendor-expenses...');
    const vendorRes = await axios.get(`${BASE_URL}/dashboards/finance/vendor-expenses`, { headers });
    console.log('   ✓ Vendor expense data:', vendorRes.data.vendorData?.length || 0, 'vendors');
    if (vendorRes.data.vendorData?.length > 0) {
      console.log('   Sample:', vendorRes.data.vendorData[0]);
    }

    console.log('\n=== All Finance Manager endpoints working! ===');
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testFinanceEndpoints();
