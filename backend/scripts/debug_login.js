import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '../config.env') });

const debugLogin = async () => {
    try {
        console.log('1. Checking Environment Variables...');
        if (!process.env.MONGODB_URI) {
            console.error('CRITICAL: MONGODB_URI is missing');
        } else {
            console.log('   MONGODB_URI is present');
        }

        if (!process.env.JWT_SECRET) {
            console.error('CRITICAL: JWT_SECRET is missing');
        } else {
            console.log('   JWT_SECRET is present');
        }

        console.log('\n2. Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, {
            dbName: 'GKT-ERP'
        });
        console.log('   Connected successfully');

        console.log('\n3. Fetching a test user...');
        // Try to find any user to test structure
        const user = await User.findOne({});
        if (!user) {
            console.log('   No users found in database');
            process.exit(0);
        }
        console.log(`   Found user: ${user.email} (Role: ${user.role})`);

        console.log('\n4. Testing Password Comparison...');
        // We don't know the password, but we can check if the method throws
        try {
            const isMatch = await user.comparePassword('wrongpassword');
            console.log(`   Compare result (should be false): ${isMatch}`);
        } catch (err) {
            console.error('   CRITICAL: comparePassword threw an error:', err);
        }

        console.log('\nDiagnostic complete. If all steps passed, the issue might be network or specific to the payload.');

    } catch (error) {
        console.error('\nCRITICAL ERROR DURING DIAGNOSTIC:', error);
    } finally {
        await mongoose.connection.close();
    }
};

debugLogin();
