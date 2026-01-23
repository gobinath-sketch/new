import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['Operations Manager', 'Business Head', 'Finance Manager', 'Director', 'Sales Executive', 'Sales Manager'],
    required: true
  },
  subRole: {
    type: String,
    enum: [null],
    default: null
  },
  name: {
    type: String,
    required: true
  },
  avatarDataUrl: {
    type: String,
    default: ''
  },
  settings: {
    emailNotifications: { type: Boolean, default: true },
    lowGPAlerts: { type: Boolean, default: true },
    dashboardRefresh: { type: Number, default: 5 },
    theme: { type: String, default: 'light' },
    dateFormat: { type: String, default: 'DD/MM/YYYY' },
    timeZone: { type: String, default: 'Asia/Kolkata' },
    autoSave: { type: Boolean, default: true },
    itemsPerPage: { type: Number, default: 10 },
    sidebarCompact: { type: Boolean, default: false },
    denseTables: { type: Boolean, default: false },
    reduceMotion: { type: Boolean, default: false }
  },
  downloads: [
    {
      title: { type: String, default: '' },
      type: { type: String, default: '' },
      contentHtml: { type: String, default: '' },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  targets: [
    {
      year: { type: Number, required: true },
      period: { type: String, required: true },
      amount: { type: Number, required: true }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
