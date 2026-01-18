import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../config.env') });

const updatedUsers = [
  {
    email: 'operations@singleplayground.com',
    password: 'Operations@2026',
    role: 'Operations Manager'
  },
  {
    email: 'business@singleplayground.com',
    password: 'Business@2026',
    role: 'Business Head'
  },
  {
    email: 'finance@singleplayground.com',
    password: 'Finance@2026',
    role: 'Finance Manager'
  },
  {
    email: 'director@singleplayground.com',
    password: 'Director@2026',
    role: 'Director'
  }
];

async function updatePasswords() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for password update');
    console.log('Database: GKT-ERP');

    for (const userData of updatedUsers) {
      const user = await User.findOne({ email: userData.email });
      if (!user) {
        console.log(`User ${userData.email} not found, skipping...`);
        continue;
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      user.password = hashedPassword;
      await user.save();
      console.log(`Updated password for: ${userData.email} (${userData.role})`);
    }

    console.log('\nPassword update completed!');
    console.log('All passwords updated to 2026');
    console.log('\nUpdated Credentials:');
    console.log('Operations Manager: operations@singleplayground.com / Operations@2026');
    console.log('Business Head: business@singleplayground.com / Business@2026');
    console.log('Finance Manager: finance@singleplayground.com / Finance@2026');
    console.log('Director: director@singleplayground.com / Director@2026');
    
    process.exit(0);
  } catch (error) {
    console.error('Update error:', error);
    process.exit(1);
  }
}

updatePasswords();
