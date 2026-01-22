import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../config.env') });

const defaultUsers = [
  {
    email: 'operations@singleplayground.com',
    password: 'Operations@2026',
    role: 'Operations Manager',
    name: 'Operations Manager'
  },
  {
    email: 'business@singleplayground.com',
    password: 'Business@2026',
    role: 'Business Head',
    name: 'Business Head'
  },
  {
    email: 'finance@singleplayground.com',
    password: 'Finance@2026',
    role: 'Finance Manager',
    name: 'Finance Manager'
  },
  {
    email: 'director@singleplayground.com',
    password: 'Director@2026',
    role: 'Director',
    name: 'Director'
  },
  {
    email: 'salesexec@singleplayground.com',
    password: 'SalesExec@2026',
    role: 'Sales Executive',
    name: 'Sales Executive'
  },
  {
    email: 'salesmgr@singleplayground.com',
    password: 'SalesMgr@2026',
    role: 'Sales Manager',
    name: 'Sales Manager'
  }
];

async function seedUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'GKT-ERP'
    });

    await User.deleteMany({
      email: { $in: defaultUsers.map(u => u.email) }
    });

    for (const userData of defaultUsers) {
      const user = new User(userData);
      await user.save();
    }
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    await mongoose.connection.close();
    process.exit(1);
  }
}

seedUsers();
