import axios from 'axios';

const API = 'http://localhost:5000/api';

async function test() {
  try {
    // Login as Operations Manager
    console.log('1. Logging in as Operations Manager...');
    const login = await axios.post(`${API}/auth/login`, {
      email: 'operations@singleplayground.com',
      password: 'Operations@2026'
    });
    const token = login.data.token;
    console.log('   ✓ Login successful');

    const config = { headers: { Authorization: `Bearer ${token}` } };

    // Test operations dashboard
    console.log('2. Testing /dashboards/operations...');
    const dashboard = await axios.get(`${API}/dashboards/operations`, config);
    console.log('   ✓ Dashboard data:', {
      todaysSessions: dashboard.data.todaysSessions?.length || 0,
      upcomingPrograms: dashboard.data.upcomingPrograms?.length || 0,
      pendingApprovals: dashboard.data.pendingApprovals?.length || 0,
      deliveryRisks: dashboard.data.deliveryRisks?.length || 0,
      opportunitiesForDelivery: dashboard.data.opportunitiesForDelivery?.length || 0
    });

    // Test vendor-stats endpoint
    console.log('3. Testing /dashboards/operations/vendor-stats...');
    const vendorStats = await axios.get(`${API}/dashboards/operations/vendor-stats?year=2024-2025`, config);
    console.log('   ✓ Vendor stats:', vendorStats.data.length, 'vendors');

    // Test gp-stats endpoint
    console.log('4. Testing /dashboards/operations/gp-stats...');
    const gpStats = await axios.get(`${API}/dashboards/operations/gp-stats?year=2024-2025`, config);
    console.log('   ✓ GP stats:', gpStats.data.length, 'months');

    console.log('\n✅ All Operations Manager endpoints working correctly!');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

test();
