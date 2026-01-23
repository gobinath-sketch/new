import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function testDirectorEndpoints() {
  console.log('=== Testing Director Endpoints ===\n');

  try {
    // Login as Director
    console.log('1. Logging in as Director...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'director@singleplayground.com',
      password: 'Director@2026'
    });
    const token = loginRes.data.token;
    console.log('   ✓ Login successful');

    const headers = { Authorization: `Bearer ${token}` };

    // Test Director dashboard
    console.log('\n2. Testing /dashboards/director...');
    const directorRes = await axios.get(`${BASE_URL}/dashboards/director`, { headers });
    console.log('   ✓ Director dashboard response:', {
      revenue: directorRes.data.revenue,
      expenses: directorRes.data.expenses,
      profitLoss: directorRes.data.profitLoss,
      profitMargin: directorRes.data.profitMargin?.toFixed(2) + '%',
      receivables: directorRes.data.receivables,
      payables: directorRes.data.payables,
      totalClients: directorRes.data.totalClients,
      totalOpportunities: directorRes.data.totalOpportunities,
      wonOpportunities: directorRes.data.wonOpportunities,
      activeOpportunities: directorRes.data.activeOpportunities,
      monthlyDataCount: directorRes.data.monthlyData?.length || 0,
      teamPerformanceCount: directorRes.data.teamPerformance?.length || 0,
      riskAlertsCount: directorRes.data.riskAlerts?.length || 0,
      veryLowGPAlertsCount: directorRes.data.veryLowGPAlerts?.length || 0
    });

    if (directorRes.data.monthlyData?.length > 0) {
      console.log('\n   Monthly Data Sample:', directorRes.data.monthlyData[0]);
    }

    if (directorRes.data.teamPerformance?.length > 0) {
      console.log('\n   Top Performer:', directorRes.data.teamPerformance[0]);
    }

    console.log('\n=== All Director endpoints working! ===');
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testDirectorEndpoints();
