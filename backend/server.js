import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, 'config.env') });

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  dbName: 'GKT-ERP'
})
  .then(() => {
    console.log('MongoDB connected');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
  });

// Import routes
import authRoutes from './routes/auth.js';
import vendorRoutes from './routes/vendors.js';
import programRoutes from './routes/programs.js';
import materialRoutes from './routes/materials.js';
import dealRoutes from './routes/deals.js';
import poRoutes from './routes/purchaseOrders.js';
import invoiceRoutes from './routes/invoices.js';
import receivableRoutes from './routes/receivables.js';
import payableRoutes from './routes/payables.js';
import governanceRoutes from './routes/governance.js';
import documentAssistantRoutes from './routes/documentAssistant.js';
import dashboardRoutes from './routes/dashboards.js';
import dealRequestRoutes from './routes/dealRequests.js';
import taxEngineRoutes from './routes/taxEngine.js';
import internalPOStatusRoutes from './routes/internalPOStatus.js';
import systemEventsRoutes from './routes/systemEvents.js';
import dropdownOptionsRoutes from './routes/dropdownOptions.js';
import quotationRoutes from './routes/quotations.js';
import purchaseOfferRoutes from './routes/purchaseOffers.js';
import bocRoutes from './routes/bocs.js';
import opportunityRoutes from './routes/opportunities.js';
import clientRoutes from './routes/clients.js';
import revenueTargetRoutes from './routes/revenueTargets.js'; // Imported
import notificationsRoutes from './routes/notifications.js';

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/deal-requests', dealRequestRoutes);
app.use('/api/purchase-orders', poRoutes);
app.use('/api/internal-po-status', internalPOStatusRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/receivables', receivableRoutes);
app.use('/api/payables', payableRoutes);
app.use('/api/tax-engine', taxEngineRoutes);
app.use('/api/governance', governanceRoutes);
app.use('/api/document-assistant', documentAssistantRoutes);
app.use('/api/system-events', systemEventsRoutes);
app.use('/api/dashboards', dashboardRoutes);
app.use('/api/dropdown-options', dropdownOptionsRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/purchase-offers', purchaseOfferRoutes);
app.use('/api/bocs', bocRoutes);
app.use('/api/revenue-targets', revenueTargetRoutes);
app.use('/api/notifications', notificationsRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
