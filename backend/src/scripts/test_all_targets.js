
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import RevenueTarget from '../models/RevenueTarget.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../config.env') });

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const testPeriod = async (label, filter, amount, description) => {
    console.log(`\n--- Testing ${label} (${description}) ---`);

    // 1. UPDATE
    // Force updatedAt to be slightly different to ensure sorting checks out essentially
    // We use $set to force update even if value is same, specifically updating updatedBy/At if needed
    // But purely relying on mongoose timestamps is safer with delays

    const payload = {
        ...filter,
        amount: amount,
        setBy: new mongoose.Types.ObjectId(), // Dummy ID
        updatedAt: new Date()
    };

    await RevenueTarget.findOneAndUpdate(
        filter,
        payload,
        { upsert: true, new: true }
    );
    console.log(`   Updated ${label} to ${(amount / 10000000).toFixed(2)} Cr`);

    // 2. VERIFY LOGIC
    const currentYear = filter.year;
    const targets = await RevenueTarget.find({ year: currentYear });

    // Logic from dashboards.js
    const latestTarget = targets.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];

    const effectiveDetails = `${latestTarget.period} ${latestTarget.quarter ? 'Q' + latestTarget.quarter : ''}`;
    console.log(`   Dashboard sees: ${effectiveDetails} -> ${(latestTarget.amount / 10000000).toFixed(2)} Cr`);

    if (latestTarget.amount === amount && latestTarget.period === filter.period) {
        if (filter.quarter && latestTarget.quarter !== filter.quarter) {
            console.log('   ❌ FAIL: Quarter mismatch');
            return false;
        }
        console.log('   ✅ PASS');
        return true;
    } else {
        console.log('   ❌ FAIL: Logic picked wrong target.');
        return false;
    }
};

const runSuite = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB. Starting Master Test Suite...');

        const year = 2026;

        // Test 1: Yearly
        await testPeriod('YEARLY', { year, period: 'Yearly' }, 110000000, '11 Cr');
        await delay(1000);

        // Test 2: Q1
        await testPeriod('Q1', { year, period: 'Quarterly', quarter: 1 }, 120000000, '12 Cr');
        await delay(1000);

        // Test 3: H1
        await testPeriod('H1', { year, period: 'H1' }, 130000000, '13 Cr');
        await delay(1000);

        // Test 4: Q2
        await testPeriod('Q2', { year, period: 'Quarterly', quarter: 2 }, 140000000, '14 Cr');
        await delay(1000);

        // Test 5: H2
        await testPeriod('H2', { year, period: 'H2' }, 150000000, '15 Cr');
        await delay(1000);

        // FINAL RESTORE: User wants H1 = 50 Cr
        console.log('\n--- FINAL RESTORE: H1 = 50 Cr ---');
        await delay(1000);
        await testPeriod('H1 (Final)', { year, period: 'H1' }, 500000000, '50 Cr');

        console.log('\n✅ ALL TESTS COMPLETED. Dashboard should now show 50.00 Cr (H1).');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

runSuite();
