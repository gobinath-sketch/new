
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import RevenueTarget from '../models/RevenueTarget.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env vars
dotenv.config({ path: join(__dirname, '../config.env') });

const fixTarget = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const year = 2026; // Based on screenshot
        const amount = 10000000; // 1 Crore

        const result = await RevenueTarget.findOneAndUpdate(
            { year: year, period: 'Yearly' },
            {
                $set: { amount: amount, updatedAt: new Date() }
            },
            { upsert: true, new: true }
        );

        console.log(`Fixed Revenue Target for ${year}:`, result);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
    }
};

fixTarget();
