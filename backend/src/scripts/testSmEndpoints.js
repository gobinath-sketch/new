import axios from 'axios';

const API = 'http://localhost:5000/api';

async function test() {
  try {
    // Login as Sales Manager
    console.log('1. Logging in as Sales Manager...');
    const login = await axios.post(`${API}/auth/login`, {
      email: 'salesmgr@singleplayground.com',
      password: 'SalesMgr@2026'
    });
    const token = login.data.token;
    console.log('   ✓ Login successful');

    const config = { headers: { Authorization: `Bearer ${token}` } };

    // Test sales-manager dashboard
    console.log('2. Testing /dashboards/sales-manager...');
    const dashboard = await axios.get(`${API}/dashboards/sales-manager`, config);
    console.log('   ✓ Dashboard data:', {
      totalClients: dashboard.data.totalClients || 0,
      teamMembersCount: dashboard.data.teamMembersCount || 0,
      inProgressOpportunities: dashboard.data.inProgressOpportunities || 0,
      completedOpportunities: dashboard.data.completedOpportunities || 0,
      poCount: dashboard.data.poCount || 0,
      invoiceCount: dashboard.data.invoiceCount || 0
    });

    // Test team-members endpoint
    console.log('3. Testing /dashboards/sales-manager/team-members...');
    const teamMembers = await axios.get(`${API}/dashboards/sales-manager/team-members`, config);
    console.log('   ✓ Team members:', teamMembers.data.length, 'members');

    // Test monthly-performance endpoint
    console.log('4. Testing /dashboards/sales-manager/monthly-performance...');
    const monthlyPerf = await axios.get(`${API}/dashboards/sales-manager/monthly-performance`, config);
    console.log('   ✓ Monthly performance:', monthlyPerf.data.length, 'months');

    console.log('\n✅ All Sales Manager endpoints working correctly!');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

test();
