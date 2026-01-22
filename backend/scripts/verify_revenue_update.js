
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import RevenueTarget from '../models/RevenueTarget.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../config.env') });

const verifyUpdate = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const year = 2026;
        const period = 'Yearly';
        const amount = 100000000; // 10 Cr

        // 1. Check existing
        const existing = await RevenueTarget.find({ year, period });
        console.log('EXISTING TARGETS:', JSON.stringify(existing, null, 2));

        // 2. Simulate Backend Logic
        const filter = { year, period };
        // backend logic: if (quarter) filter.quarter = quarter; 
        // for Yearly, quarter is undefined, so filter remains { year, period }

        console.log('Using Filter:', filter);

        const updated = await RevenueTarget.findOneAndUpdate(
            filter,
            {
                year,
                period,
                // quarter is undefined in payload
                amount,
                updatedAt: Date.now()
            },
            { new: true, upsert: true, runValidators: true }
        );

        console.log('UPDATED TARGET:', updated);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

verifyUpdate();
