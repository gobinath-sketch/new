
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
const FINANCE_EMAIL = 'finance@singleplayground.com';
const FINANCE_PASSWORD = 'Finance@2026';

const testAuth = async () => {
    try {
        console.log('1. Logging in as Finance Manager...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: FINANCE_EMAIL,
            password: FINANCE_PASSWORD
        });

        const token = loginRes.data.token;
        console.log('   Login Successful. Token received (length):', token.length);
        console.log('   User Role:', loginRes.data.user.role);

        const config = {
            headers: { Authorization: `Bearer ${token}` }
        };

        console.log('\n2. Testing GET /api/payables (Requires Finance Manager)...');
        try {
            const getRes = await axios.get(`${API_URL}/payables`, config);
            console.log('   GET Success! Status:', getRes.status);
            console.log('   Payables Count:', getRes.data.length);
        } catch (err) {
            console.error('   GET Failed:', err.response ? err.response.status : err.message);
            if (err.response) console.error('   Error data:', err.response.data);
        }

        console.log('\n3. Testing POST /api/payables (Should fail validation, not 401)...');
        // Sending empty body to trigger validation error, NOT 401
        try {
            await axios.post(`${API_URL}/payables`, {}, config);
        } catch (err) {
            if (err.response && err.response.status === 401) {
                console.error('   CRITICAL: POST returned 401 Unauthorized!');
            } else if (err.response && err.response.status !== 401) {
                console.log('   POST Success (Auth-wise)! Status:', err.response.status);
                console.log('   (Expected validation error, confirming auth worked)');
            } else {
                console.error('   POST Failed with unknown error:', err.message);
            }
        }

    } catch (error) {
        console.error('Test Failed:', error.message);
    }
};

testAuth();
