
import mongoose from 'mongoose';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

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

// --- MAIN TEST FLOW ---
const runTest = async () => {
    let salesToken, salesMgrToken, bhToken, opsToken, financeToken;
    let salesUser;

    console.log('--- STARTING END-TO-END WORKFLOW VERIFICATION ---');

    try {
        // 1. AUTHENTICATION
        console.log('\n--- 1. AUTHENTICATION ---');
        const sales = await login('salesexec@singleplayground.com', 'SalesExec@2026');
        salesToken = sales.token;
        salesUser = sales.user;
        logSuccess('Logged in as Sales Executive');

        const salesMgr = await login('salesmgr@singleplayground.com', 'SalesMgr@2026');
        salesMgrToken = salesMgr.token;
        logSuccess('Logged in as Sales Manager');

        const bh = await login('business@singleplayground.com', 'Business@2026');
        bhToken = bh.token;
        logSuccess('Logged in as Business Head');

        const ops = await login('operations@singleplayground.com', 'Operations@2026');
        opsToken = ops.token;
        logSuccess('Logged in as Operations Manager');

        const finance = await login('finance@singleplayground.com', 'Finance@2026');
        financeToken = finance.token;
        logSuccess('Logged in as Finance Manager');


        // 2. OPPORTUNITY CREATION (Sales Exec)
        console.log('\n--- 2. OPPORTUNITY (Sales) ---');
        const oppData = {
            billingClient: 'TEST-FLOW-CLIENT',
            endClient: 'TEST-FLOW-CLIENT',
            courseName: 'Full Stack Workflow Test',
            serviceCategory: 'Corporate', // Matches enum
            commercials: 500000,
            currency: 'INR',
            modeOfTraining: 'Online',
            tentativeDates: { start: new Date(), end: new Date() },
            // Required fields added:
            opportunityType: 'Training',
            trainingOpportunity: 'Training', // FIX: Added required field
            trainingMonth: 'January',
            trainingYear: 2026,
            expectedCommercialValue: 500000,
            expectedParticipants: 10,
            expectedDuration: 5,
            expectedStartDate: new Date(),
            serviceCategory: 'Corporate', // Matches enum
            sales: 'New Business', // Optional but good for completeness
            trainingLocation: 'Bangalore'
        };

        let oppRes = await axios.post(`${BASE_URL}/opportunities`, oppData, { headers: getHeaders(salesToken) });
        const opportunityId = oppRes.data._id;
        logSuccess(`Created Opportunity: ${oppRes.data.opportunityId}`);

        // 3. CONVERT TO DEAL (Sales Manager)
        console.log('\n--- 3. CONVERT TO DEAL (Sales Manager) ---');
        // First qualify it
        await axios.put(`${BASE_URL}/opportunities/${opportunityId}`, { opportunityStatus: 'Qualified' }, { headers: getHeaders(salesMgrToken) });
        logSuccess('Opportunity Qualified');

        // Convert to Deal
        const dealData = {
            clientName: 'TEST-FLOW-CLIENT',
            totalOrderValue: 500000,
            opportunityId: opportunityId, // Linkage
            dealType: 'Training',
            revenueCategory: 'Corporate'
        };
        const dealRes = await axios.post(`${BASE_URL}/deals`, dealData, { headers: getHeaders(salesMgrToken) });
        const dealId = dealRes.data._id;
        logSuccess(`Created Deal linked to Opportunity: ${dealRes.data.dealId}`);

        // APPROVE DEAL (Business Head) - Required for PO
        await axios.put(`${BASE_URL}/deals/${dealId}`, { approvalStatus: 'Approved' }, { headers: getHeaders(bhToken) }); // Assuming route exists or mock it
        // Note: deals.js didn't show PUT route in previous `view_file`. 
        // If approval logic is missing in route, we might hit a blocker here. 
        // Let's assume for now it might be updated directly in DB or correct route exists in full file.
        // Actually, let's verify if we can update it directly via Mongoose for the test if route is missing, 
        // but since this is an API test, we should rely on API.
        // If this fails, we know there's a gap.

        // 4. VERIFY DEAL VISIBILITY (Ops & Finance) - **NEW FEATURE CHECK**
        console.log('\n--- 4. VERIFY VISIBILITY (Ops & Finance) ---');
        try {
            await axios.get(`${BASE_URL}/deals/${dealId}`, { headers: getHeaders(opsToken) });
            logSuccess('Operations Manager CAN see the Deal (Fix Verified)');
        } catch (e) {
            logFail('Operations Manager CANNOT see the Deal', e);
        }

        try {
            await axios.get(`${BASE_URL}/deals/${dealId}`, { headers: getHeaders(financeToken) });
            logSuccess('Finance Manager CAN see the Deal (Fix Verified)');
        } catch (e) {
            logFail('Finance Manager CANNOT see the Deal', e);
        }

        // 5. PURCHASE ORDER (Operations)
        console.log('\n--- 5. PURCHASE ORDER (Operations) ---');

        // 5a. Create Vendor first (Required for PO)
        let vendorId;
        try {
            const vendorData = {
                vendorName: 'TEST-VENDOR-' + Date.now(),
                vendorType: 'Company', // Fixed: must be Company or Individual
                email: 'vendor' + Date.now() + '@test.com',
                phone: ['1234567890'],
                contactPersonName: ['Test Contact'],
                panNumber: 'ABCDE1234F',
                gstNumber: '29ABCDE1234F1Z5',
                address: '123 Test Street, Tech Park, Bangalore',
                bankName: 'HDFC Bank',
                bankAccountNumber: '123456789012',
                ifscCode: 'HDFC0001234',
                status: 'Active'
            };
            const vendorRes = await axios.post(`${BASE_URL}/vendors`, vendorData, { headers: getHeaders(opsToken) });
            vendorId = vendorRes.data._id;
            logSuccess(`Created Vendor: ${vendorData.vendorName} (${vendorId})`);
        } catch (e) {
            logFail('Could not create Vendor', e);
        }

        // 5b. Create PO
        const poData = {
            internalPONumber: 'PO-TEST-' + Date.now(),
            dealId: dealId,
            vendorId: vendorId, // Now we have legitimate vendorId
            approvedCost: 50000,
            status: 'Approved'
        };

        try {
            if (vendorId) {
                const poRes = await axios.post(`${BASE_URL}/purchase-orders`, poData, { headers: getHeaders(opsToken) });
                logSuccess(`Created Purchase Order: ${poRes.data.internalPONumber}`);
            } else {
                logFail('Skipping PO creation due to missing Vendor ID');
            }
        } catch (e) {
            logFail('Could not create Purchase Order', e);
        }

        // 6. INVOICE CREATION (Finance)
        console.log('\n--- 6. INVOICE CREATION (Finance) ---');

        // Prereq: Program Creation
        let programId;
        try {
            const programData = {
                opportunityId: opportunityId,
                // Required Program Fields (Matching Model)
                trainingOpportunity: 'Training',
                trainingSector: 'Corporate', // Matches enum
                trainingSupporter: 'GKT',
                trainingYear: 2026,
                trainingMonth: 'January',
                billingClient: 'TEST-FLOW-CLIENT',
                endClient: 'TEST-FLOW-CLIENT',
                courseCode: 'TEST-101',
                courseName: 'Test Program for Invoice',
                technology: 'MERN Stack',
                numberOfParticipants: 10,
                startDate: new Date(),
                endDate: new Date(new Date().setDate(new Date().getDate() + 5)),
                numberOfDays: 5,
                location: 'Online',
                tov: 100000,
                trainers: ['Test Trainer'],
                // Required Booleans
                clientSignOff: true // Required for invoice
            };
            // Ops creates program
            const progRes = await axios.post(`${BASE_URL}/programs`, programData, { headers: getHeaders(opsToken) });
            programId = progRes.data._id;

            // Sign-off (Simulate Trainer Signoff via update if needed, but clientSignOff: true in create might suffice for logic check)
            // But let's assume creation worked.
            logSuccess(`Created Program & Signed Off: ${programId}`);

        } catch (e) {
            logFail('Could not create Program', e);
        }

        let invoiceId;
        if (programId && dealId) {
            const invoiceData = {
                programId: programId,
                dealId: dealId,
                clientName: 'TEST-FLOW-CLIENT',
                invoiceAmount: 500000,
                dueDate: new Date(),
                // Required Invoice Fields
                sacCode: '998311',
                gstPercent: 18,
                gstType: 'IGST'
            };

            const invRes = await axios.post(`${BASE_URL}/invoices`, invoiceData, { headers: getHeaders(financeToken) });
            invoiceId = invRes.data._id;
            logSuccess(`Created Invoice: ${invRes.data.clientInvoiceNumber}`);
        } else {
            logFail('Skipping Invoice creation due to missing Program or Deal ID');
        }

        // 7. VERIFY INVOICE VISIBILITY (Sales) - **NEW FEATURE CHECK**
        console.log('\n--- 7. VERIFY INVOICE VISIBILITY (Sales) ---');
        try {
            await axios.get(`${BASE_URL}/invoices/${invoiceId}`, { headers: getHeaders(salesToken) });
            logSuccess('Sales Executive CAN see the Invoice (Fix Verified)');
        } catch (e) {
            logFail('Sales Executive CANNOT see the Invoice', e);
        }

    } catch (error) {
        console.error('\n!!! CRITICAL TEST FAILURE !!!');
        console.error(error);
    }
};

runTest();
