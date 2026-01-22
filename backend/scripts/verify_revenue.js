
import axios from 'axios';

// Configuration
const API_URL = 'http://localhost:5000/api';
const EMAIL = 'business@singleplayground.com';
const PASSWORD = 'Business@2026';

// Random Deal Data
const totalOrderValue = Math.floor(Math.random() * 500000) + 100000; // 1L to 6L
const dealData = {
    clientName: `Test Client ${Math.floor(Math.random() * 1000)}`,
    title: 'Real-time Verification Deal',
    totalOrderValue: totalOrderValue,
    dealStage: 'Closed Won', // Assuming closed won adds to revenue
    expectedDate: new Date(),
    billingStart: new Date(),
    billingEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    paymentTerms: 'Net 30'
};

const verify = async () => {
    try {
        console.log('--- Real-time Revenue Verification ---');
        console.log(`1. Logging in as ${EMAIL}...`);

        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: EMAIL,
            password: PASSWORD
        });

        const token = loginRes.data.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        console.log('   Login successful.');

        // Get Initial Revenue
        console.log('2. Fetching initial dashboard revenue...');
        const initDash = await axios.get(`${API_URL}/dashboards/business`, config);
        const initialRevenue = initDash.data.currentRevenue || 0;
        console.log(`   Initial Revenue: ₹${initialRevenue.toLocaleString()}`);

        // Create Deal
        console.log(`3. Creating a new Deal worth ₹${totalOrderValue.toLocaleString()}...`);
        const dealRes = await axios.post(`${API_URL}/deals`, dealData, config);
        console.log(`   Deal Created! ID: ${dealRes.data._id}`);

        // 3b. Create Invoice (Must be Finance Manager)
        console.log(`3b. Logging in as Finance Manager to create Invoice...`);
        const financeLogin = await axios.post(`${API_URL}/auth/login`, {
            email: 'finance@singleplayground.com',
            password: 'Finance@2026'
        });
        const financeToken = financeLogin.data.token;
        const financeConfig = { headers: { Authorization: `Bearer ${financeToken}` } };

        // 3b. Create Program (Ops Manager)
        console.log(`3b. Logging in as Ops Manager to create Program...`);
        const opsLogin = await axios.post(`${API_URL}/auth/login`, { email: 'operations@singleplayground.com', password: 'Operations@2026' });
        const opsToken = opsLogin.data.token;
        const opsConfig = { headers: { Authorization: `Bearer ${opsToken}` } };

        const programRes = await axios.post(`${API_URL}/programs`, {
            programName: `TEST-PROG-${Date.now()}`,
            courseName: 'Revenue Test Course',
            billingClient: dealData.clientName,
            endClient: dealData.clientName,
            clientSignOff: true, // Required for invoice
            startDate: new Date(),
            endDate: new Date(),
            deliveryStatus: 'Completed',
            dealId: dealRes.data._id, // Link to deal
            // Required fields for validation
            tov: totalOrderValue,
            location: 'Classroom', // Valid enum value
            trainingLocation: 'Bangalore', // Free text
            trainingSector: 'Corporate',
            trainingOpportunity: 'Training',
            trainingSupporter: 'GKT',
            numberOfParticipants: 10,
            numberOfDays: 1,
            technology: 'IBM',
            courseCode: 'TEST-REV-001',
            trainingYear: 2026,
            trainingMonth: 'January'
        }, opsConfig);
        console.log(`   Program Created! ID: ${programRes.data._id}`);

        // 3c. Create Invoice (Finance Manager)
        console.log(`3c. Logging in as Finance Manager to create Invoice...`);
        const finLogin = await axios.post(`${API_URL}/auth/login`, { email: 'finance@singleplayground.com', password: 'Finance@2026' });
        const finToken = finLogin.data.token;
        const finConfig = { headers: { Authorization: `Bearer ${finToken}` } };

        const invoiceData = {
            clientName: dealData.clientName,
            clientInvoiceNumber: `INV-${Date.now()}`, // Correct field name
            invoiceDate: new Date(),
            invoiceAmount: totalOrderValue, // Base amount
            totalAmount: totalOrderValue * 1.18, // Provide calculated total
            gstType: 'IGST',
            gstPercent: 18,
            sacCode: '999293',
            status: 'Generated',
            dealId: dealRes.data._id,
            programId: programRes.data._id,
            billingEntity: 'GKT'
        };

        const createdInvoice = await axios.post(`${API_URL}/invoices`, invoiceData, finConfig);
        console.log('   Invoice Created!');

        // Debug: Check invoice details
        const savedInvoice = await axios.get(`${API_URL}/invoices/${createdInvoice.data._id}`, finConfig);
        console.log(`   Invoice persisted. Amount: ${savedInvoice.data.totalAmount}, Date: ${savedInvoice.data.invoiceDate}`);

        // Wait for propagation
        console.log('   Waiting 2s for dashboard update...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Get Updated Revenue
        console.log('4. Fetching updated dashboard revenue...');
        const finalDash = await axios.get(`${API_URL}/dashboards/business`, config);
        const finalRevenue = finalDash.data.currentRevenue || 0;
        console.log(`   Final Revenue:   ₹${finalRevenue.toLocaleString()}`);

        // Verification
        // Dashboard shows Total Revenue (Gross Amount inclusive of Tax)
        const expectedRevenue = initialRevenue + (totalOrderValue * 1.18);

        // Allow distinct floats comparison
        if (Math.abs(finalRevenue - expectedRevenue) < 1.0) {
            console.log(`✅ SUCCESS: Revenue updated correctly! (Expected: ${expectedRevenue.toFixed(2)}, Got: ${finalRevenue.toFixed(2)})`);
        } else {
            console.log(`❌ FAILED: Expected ₹${expectedRevenue.toLocaleString()}, got ₹${finalRevenue.toLocaleString()}`);
            process.exit(1);
        }

    } catch (error) {
        console.error('VERIFICATION FAILED:', error.response ? error.response.data : error.message);
        process.exit(1);
    }
};

verify();

