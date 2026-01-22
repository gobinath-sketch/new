import mongoose from 'mongoose';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../config.env') });

const BASE_URL = 'http://localhost:5000/api';

// --- HELPER FUNCTIONS ---
const login = async (email, password) => {
    try {
        const res = await axios.post(`${BASE_URL}/auth/login`, { email, password });
        return { token: res.data.token, user: res.data.user };
    } catch (error) {
        console.error(`Login failed for ${email}:`, error.response?.data?.error || error.message);
        throw error;
    }
};

const getHeaders = (token) => ({ Authorization: `Bearer ${token}` });

const logSuccess = (msg) => console.log(`✅ SUCCESS: ${msg}`);
const logFail = (msg, err) => {
    console.error(`❌ FAILED: ${msg}`);
    if (err.response) {
        console.error('Status:', err.response.status);
        console.error('Data:', JSON.stringify(err.response.data, null, 2));
    } else {
        console.error('Error:', err.message);
    }
};

// --- MAIN VERIFICATION FLOW ---
const verifyNotifications = async () => {
    console.log('--- STARTING NOTIFICATION SYSTEM VERIFICATION ---');

    try {
        // 1. LOGIN ALL ROLES
        console.log('\n--- 1. AUTHENTICATING ROLES ---');
        const sales = await login('salesexec@singleplayground.com', 'SalesExec@2026');
        const salesMgr = await login('salesmgr@singleplayground.com', 'SalesMgr@2026');
        const ops = await login('operations@singleplayground.com', 'Operations@2026');
        const finance = await login('finance@singleplayground.com', 'Finance@2026');
        const business = await login('business@singleplayground.com', 'Business@2026');
        const director = await login('director@singleplayground.com', 'Director@2026');

        logSuccess('All roles authenticated successfully');

        // 2. CREATE OPPORTUNITY (Sales Exec) -> Verify Notifications
        console.log('\n--- 2. OPPORTUNITY CREATION NOTIFICATIONS ---');
        const oppData = {
            billingClient: 'NOTIF-TEST-CLIENT',
            endClient: 'NOTIF-TEST-CLIENT',
            courseName: 'Notification Test Course',
            serviceCategory: 'Corporate', // Matches enum
            commercials: 100000,
            currency: 'INR',
            modeOfTraining: 'Online',
            tentativeDates: { start: new Date(), end: new Date() },
            // Required fields added:
            opportunityType: 'Training',
            trainingOpportunity: 'Training',
            trainingMonth: 'January',
            trainingYear: 2026,
            expectedCommercialValue: 100000,
            expectedParticipants: 5,
            expectedDuration: 2,
            expectedStartDate: new Date(),
            sales: 'Notification Test',
            trainingLocation: 'Remote',
            // Costing for high GP to avoid alerts for now
            tov: 100000,
            trainerPOValues: 10000,
            marketingChargesPercent: 0,
            contingencyPercent: 0
        };

        const oppRes = await axios.post(`${BASE_URL}/opportunities`, oppData, { headers: getHeaders(sales.token) });
        const opportunityId = oppRes.data._id;
        logSuccess(`Created Opportunity: ${oppRes.data.opportunityId}`);

        // EXPECTED: Sales Mgr, Ops Mgr, Finance Mgr, Business Head should get notification
        // NOT EXPECTED: Director (unless logic changed), Sales Exec (Creator)

        await verifyNotificationReceived(salesMgr.token, 'Sales Manager', 'opportunity_created', opportunityId);
        await verifyNotificationReceived(ops.token, 'Operations Manager', 'opportunity_created', opportunityId);
        await verifyNotificationReceived(finance.token, 'Finance Manager', 'opportunity_created', opportunityId);
        await verifyNotificationReceived(business.token, 'Business Head', 'opportunity_created', opportunityId);

        // 3. QUALIFY OPPORTUNITY (Sales Mgr) -> Verify Notifications
        console.log('\n--- 3. OPPORTUNITY QUALIFIED NOTIFICATIONS ---');
        await axios.put(`${BASE_URL}/opportunities/${opportunityId}`, { opportunityStatus: 'Qualified' }, { headers: getHeaders(salesMgr.token) });
        logSuccess('Opportunity Qualified by Sales Manager');

        // EXPECTED: Ops Mgr, Finance Mgr, Business Head
        await verifyNotificationReceived(ops.token, 'Operations Manager', 'opportunity_qualified', opportunityId);
        await verifyNotificationReceived(finance.token, 'Finance Manager', 'opportunity_qualified', opportunityId);
        await verifyNotificationReceived(business.token, 'Business Head', 'opportunity_qualified', opportunityId);

        // 4. CONVERT TO DEAL (Sales Mgr) -> Verify Notifications
        console.log('\n--- 4. OPPORTUNITY CONVERTED NOTIFICATIONS ---');
        // Need to create Deal to trigger conversion notification if that's how it works, 
        // OR the notification triggers on status change to 'Won' or similar?
        // notificationService.js handles 'opportunity_converted'. 
        // Let's see if updating status to 'Closed Won' triggers it or explicit endpoint.
        // Usually creating a Deal triggers it.
        const dealData = {
            clientName: 'NOTIF-TEST-CLIENT',
            totalOrderValue: 100000,
            opportunityId: opportunityId,
            dealType: 'Training',
            revenueCategory: 'Corporate'
        };
        const dealRes = await axios.post(`${BASE_URL}/deals`, dealData, { headers: getHeaders(salesMgr.token) });
        logSuccess(`Created Deal (Converted Opp): ${dealRes.data.dealId}`);

        // EXPECTED: Business Head, Director, Finance Manager
        // Note: verifyNotificationReceived checks for entityId. If conversion notifies about Opportunity, use oppId. If Deal, use dealId.
        // notificationService.js says 'opportunity_converted' takes entityId. Likely the Opportunity ID.
        await verifyNotificationReceived(business.token, 'Business Head', 'opportunity_converted', opportunityId);
        await verifyNotificationReceived(director.token, 'Director', 'opportunity_converted', opportunityId);
        await verifyNotificationReceived(finance.token, 'Finance Manager', 'opportunity_converted', opportunityId);

        console.log('\n✅ ALL NOTIFICATION TESTS PASSED');

    } catch (error) {
        console.error('\n!!! CRITICAL VERIFICATION FAILURE !!!');
        console.error(error);
        process.exit(1);
    }
};

const verifyNotificationReceived = async (token, roleName, type, entityId) => {
    // Fetch notifications for the user
    const res = await axios.get(`${BASE_URL}/notifications`, { headers: getHeaders(token) });
    // Handle both direct array and object with notifications property
    const notifications = Array.isArray(res.data) ? res.data : (res.data.notifications || []);

    // Look for recent notification of correct type and entity
    // We can filter by type and entityId
    const match = notifications.find(n =>
        n.type === type &&
        n.entityId === entityId
    );

    if (match) {
        logSuccess(`[${roleName}] Received notification for ${type}`);
    } else {
        logFail(`[${roleName}] DID NOT receive notification for ${type}`, { message: `Found ${notifications.length} other notifications` });
        throw new Error(`Notification failure for ${roleName}`);
    }
};

verifyNotifications();
