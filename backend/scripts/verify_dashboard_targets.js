
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import RevenueTarget from '../models/RevenueTarget.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../config.env') });

const verifyLogic = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const year = 2026;
        const targets = await RevenueTarget.find({ year });

        console.log(`Found ${targets.length} targets for ${year}:`);
        targets.forEach(t => {
            console.log(`- Period: ${t.period} | Amount: ${(t.amount / 10000000).toFixed(2)} Cr | UpdatedAt: ${t.updatedAt.toISOString()}`);
        });

        // SIMULATE BACKEND LOGIC
        // const latestTarget = targets.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];

        // Sort copy to not affect original array print correctness if needed
        const sorted = [...targets].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        const latestTarget = sorted[0];

        console.log('\n--- LOGIC VERIFICATION ---');
        console.log('Sorting by updatedAt DESC...');

        if (latestTarget) {
            console.log(`WINNER (Latest): Period: ${latestTarget.period} | Amount: ${(latestTarget.amount / 10000000).toFixed(2)} Cr`);

            const expectedAmount = 500000000; // 50 Cr
            if (latestTarget.amount === expectedAmount) {
                console.log('✅ SUCCESS: Logic correctly picks the 50 Cr H1 Target!');
            } else {
                console.log('❌ FAIL: Logic picked something else.');
            }
        } else {
            console.log('❌ FAIL: No targets found.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

verifyLogic();
