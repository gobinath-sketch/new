
import axios from 'axios';
// Hardcoded users for testing (since seedUsers.js doesn't export them)
const users = [
    { email: 'operations@singleplayground.com', password: 'Operations@2026', role: 'Operations Manager' },
    { email: 'business@singleplayground.com', password: 'Business@2026', role: 'Business Head' },
    { email: 'finance@singleplayground.com', password: 'Finance@2026', role: 'Finance Manager' },
    { email: 'director@singleplayground.com', password: 'Director@2026', role: 'Director' },
    { email: 'salesexec@singleplayground.com', password: 'SalesExec@2026', role: 'Sales Executive' },
    { email: 'salesmgr@singleplayground.com', password: 'SalesMgr@2026', role: 'Sales Manager' }
];

const BASE_URL = 'http://localhost:5000/api';

const login = async (role) => {
    const user = users.find(u => u.role === role);
    if (!user) {
        console.error(`User with role ${role} not found in seedUsers.js`);
        return null; // Return null effectively if user not found, handling logic downstream
    }
    try {
        const res = await axios.post(`${BASE_URL}/auth/login`, {
            email: user.email,
            password: user.password
        });
        console.log(`✅ Logged in as ${role}`);
        return res.data.token;
    } catch (error) {
        console.error(`❌ Failed to login as ${role}:`, error.message);
        return null;
    }
};

const getHeaders = (token) => ({ 'Authorization': `Bearer ${token}` });

const verifyNotifications = async () => {
    console.log('--- STARTING NOTIFICATION SYSTEM TEST ---');

    // 1. Login as Sales Executive (Creator) and Sales Manager (Receiver)
    const execToken = await login('Sales Executive');
    const mgrToken = await login('Sales Manager');

    if (!execToken || !mgrToken) {
        console.error('❌ Login failed. Aborting test.');
        return;
    }

    try {
        // 2. Check initial notification count for Sales Manager
        const initialRes = await axios.get(`${BASE_URL}/notifications`, { headers: getHeaders(mgrToken) });
        const initialCount = initialRes.data.notifications.length;
        console.log(`ℹ️ Initial Notifications for Sales Manager: ${initialCount}`);

        // 3. Create an Opportunity as Sales Executive
        const oppData = {
            billingClient: 'Test Client Notifications',
            endClient: 'End Client Notifications',
            opportunityType: 'Training',
            trainingOpportunity: 'Training',
            trainingMonth: 'January',
            trainingYear: 2026,
            expectedCommercialValue: 100000,
            expectedParticipants: 10,
            expectedDuration: 5,
            expectedStartDate: new Date(),
            serviceCategory: 'Corporate',
            sales: 'New Business',
            trainingLocation: 'Onsite',
            tov: 100000
        };

        const createRes = await axios.post(`${BASE_URL}/opportunities`, oppData, { headers: getHeaders(execToken) });
        console.log(`✅ Opportunity Created: ${createRes.data.opportunityId}`);

        // 4. Verify Notification for Sales Manager
        // Allow a slight delay for async processing
        await new Promise(resolve => setTimeout(resolve, 2000));

        const finalRes = await axios.get(`${BASE_URL}/notifications`, { headers: getHeaders(mgrToken) });
        const finalCount = finalRes.data.notifications.length;
        const newNotification = finalRes.data.notifications[0];

        console.log(`ℹ️ Final Notifications for Sales Manager: ${finalCount}`);

        if (finalCount > initialCount) {
            console.log('✅ Notification Received by Sales Manager!');
            console.log(`   Title: "${newNotification.title}"`);
            console.log(`   Message: "${newNotification.message}"`);

            if (newNotification.title === 'New Opportunity Created') {
                console.log('✅ Correct Notification Title Verified.');
            } else {
                console.error('❌ Incorrect Notification Title.');
            }
        } else {
            console.error('❌ Notification NOT Received (Count did not increase).');
        }

    } catch (error) {
        console.error('❌ Test Execution Failed:', error.response ? error.response.data : error.message);
    }
};

verifyNotifications();
