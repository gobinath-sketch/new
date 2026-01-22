import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

// Credentials
const EMAIL = 'director@singleplayground.com';
const PASSWORD = 'Director@2026';

// create axios instance
const client = axios.create({
    baseURL: BASE_URL,
    validateStatus: () => true
});

async function login(email, password, role) {
    console.log(`🔐 Logging in as ${role} (${email})...`);
    const res = await client.post('/auth/login', { email, password });
    if (res.status === 200 && res.data.token) {
        console.log(`   ✅ Login Successful`);
        client.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        return true;
    } else {
        console.error(`   ❌ Login Failed: ${res.status}`, res.data);
        return false;
    }
}

// --- TEST SCENARIOS ---
const TEST_SCENARIOS = [
    {
        name: "💰 High Margin Project",
        tov: 1000000, // 10L
        expenses: [
            { type: 'Trainer', amount: 150000 },
            { type: 'Venue', amount: 50000 }
        ]
    },
    {
        name: "📉 Loss Making Project",
        tov: 200000, // 2L
        expenses: [
            { type: 'Trainer', amount: 200000 }, // High Cost
            { type: 'Travel', amount: 50000 }
        ]
    },
    {
        name: "🏢 Standard Corporate Training",
        tov: 600000, // 6L
        expenses: [
            { type: 'Trainer', amount: 100000 },
            { type: 'Venue', amount: 100000 },
            { type: 'Travel', amount: 50000 },
            { type: 'Course Materials', amount: 50000 }
        ]
    }
];

// Multi-User Workflow Test
async function runTest() {
    console.log(`\n🔹 STARTING MULTI-CYCLE STRESS TEST (3 CYCLES)\n`);

    // Logins
    await login('salesmgr@singleplayground.com', 'SalesMgr@2026', 'Sales Manager');
    const salesToken = client.defaults.headers.common['Authorization'];

    await login('finance@singleplayground.com', 'Finance@2026', 'Finance Manager');
    const financeToken = client.defaults.headers.common['Authorization'];

    for (let i = 0; i < TEST_SCENARIOS.length; i++) {
        const scenario = TEST_SCENARIOS[i];
        console.log(`\n---------------------------------------------------------`);
        console.log(`🔁 CYCLE ${i + 1}: ${scenario.name}`);
        console.log(`---------------------------------------------------------`);

        // 1. Create Opportunity (Sales)
        client.defaults.headers.common['Authorization'] = salesToken;
        const oppData = {
            clientName: `Stress Test Client ${i + 1}`,
            clientCompanyName: `Stress Test Client ${i + 1} Corp`,
            clientContactName: 'Auto Contact',
            clientEmail: 'auto.test@stress.com',
            clientPhone: '9876543210',
            designation: 'Manager', // Required
            opportunityType: 'Training', // Required Enum
            serviceCategory: 'Corporate', // Required Enum
            trainingLocation: 'Bangalore',
            location: 'Classroom',
            expectedStartDate: '2026-03-01',
            expectedDuration: 5,
            expectedParticipants: 10,
            expectedCommercialValue: scenario.tov,
            sales: 'Auto Tester',
            trainingMonth: 'March',
            trainingYear: 2026,
            trainingOpportunity: 'Stress Test Opp',
            trainingSector: 'IT',
            trainingStatus: 'Scheduled'
        };

        const oppRes = await client.post('/opportunities', oppData);
        if (oppRes.status !== 201) {
            console.error(`   ❌ Failed Cycle ${i + 1}:`, oppRes.status, oppRes.data);
            continue;
        }
        const adhocId = oppRes.data.adhocId;
        console.log(`   ✅ Opportunity Created: ${adhocId}`);

        // 2. Add Receivable (Finance)
        client.defaults.headers.common['Authorization'] = financeToken;
        const recData = {
            adhocId: adhocId,
            poNumber: `PO-STRESS-${i}`,
            invoiceNumber: `INV-STRESS-${i}`,
            invoiceDate: '2026-03-01',
            clientName: oppData.clientName,
            invoiceAmount: scenario.tov * 1.18,
            taxableAmount: scenario.tov,
            gstAmount: scenario.tov * 0.18,
            totalAmount: scenario.tov * 1.18,
            outstandingAmount: scenario.tov * 1.18,
            paymentTerms: 30
        };
        await client.post('/receivables', recData);
        console.log(`   ✅ Receivable Added: ₹${scenario.tov}`);

        // 3. Add Payables
        for (const exp of scenario.expenses) {
            const payData = {
                adhocId: adhocId,
                expenseType: exp.type,
                vendorName: `Auto Vendor ${exp.type}`,
                amount: exp.amount, // Simple mapping for test
                taxableAmount: exp.amount,
                description: 'Auto Generated',
                isSimple: true // Force simple path for speed
            };
            await client.post('/payables', payData);
        }
        console.log(`   ✅ Payables Added: ${scenario.expenses.length} items`);

        // 4. Verification
        // Fetch fresh data
        const recsRes = await client.get('/receivables');
        const paysRes = await client.get('/payables');

        const myRecs = recsRes.data.filter(r => r.adhocId === adhocId);
        const myPays = paysRes.data.filter(p => p.adhocId === adhocId);

        const actualTov = myRecs.reduce((sum, item) => sum + (item.taxableAmount || 0), 0);
        const actualExp = myPays.reduce((sum, item) => sum + (item.taxableAmount || item.amount || 0), 0);
        const profit = actualTov - actualExp;

        const expectedExp = scenario.expenses.reduce((sum, item) => sum + item.amount, 0);

        console.log(`   📊 VERIFICATION:`);
        console.log(`      Title   : ${scenario.name}`);
        console.log(`      TOV     : ${actualTov} (Expected: ${scenario.tov})`);
        console.log(`      Expense : ${actualExp} (Expected: ${expectedExp})`);
        console.log(`      Profit  : ${profit}`);

        if (actualTov === scenario.tov && actualExp === expectedExp) {
            console.log(`      RESULT  : ✅ PASSED`);
        } else {
            console.log(`      RESULT  : ❌ FAILED`);
        }
    }
}

runTest();
