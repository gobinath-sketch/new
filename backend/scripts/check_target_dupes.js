
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import RevenueTarget from '../models/RevenueTarget.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../config.env') });

const checkDuplicates = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const targets = await RevenueTarget.find({ year: 2026 });
        console.log(`Found ${targets.length} targets for 2026:`);
        console.log(JSON.stringify(targets, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

checkDuplicates();
