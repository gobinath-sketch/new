
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
const EMAIL = 'director@singleplayground.com';
const PASSWORD = 'Director@2026';

const verifyDirector = async () => {
    try {
        console.log(`Logging in as ${EMAIL}...`);
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: EMAIL,
            password: PASSWORD
        });
        const token = loginRes.data.token;
        console.log('Login successful.');

        console.log('Fetching Director Dashboard...');
        const res = await axios.get(`${API_URL}/dashboards/director`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Director Dashboard Data:');
        console.log(`- Revenue: ${res.data.revenue}`);
        console.log(`- Expenses: ${res.data.expenses}`);
        console.log(`- Profit/Loss: ${res.data.profitLoss}`);

        if (res.data.revenue === 0) {
            console.log('❌ FAIL: Revenue is 0.00 despite data existing in DB.');
        } else {
            console.log('✅ PASS: Revenue is being returned correctly.');
        }

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
};

verifyDirector();
