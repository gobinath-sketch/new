
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../config.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        const Invoice = mongoose.model('Invoice', new mongoose.Schema({
            invoiceDate: Date,
            totalAmount: Number,
            status: String,
            clientName: String
        }));

        const currentYear = new Date().getFullYear();
        const startOfYear = new Date(currentYear, 0, 1);

        console.log(`Checking Invoices for Current Year: ${currentYear} (Start: ${startOfYear.toISOString()})`);

        const invoices = await Invoice.find({});

        console.log(`Total Invoices Found: ${invoices.length}`);

        const currentYearInvoices = invoices.filter(inv => new Date(inv.invoiceDate) >= startOfYear);

        console.log(`Invoices matching current year query: ${currentYearInvoices.length}`);

        currentYearInvoices.forEach(inv => {
            console.log(`- Date: ${inv.invoiceDate}, Amount: ${inv.totalAmount}, Status: ${inv.status}, Client: ${inv.clientName}`);
        });

        const totalRevenue = currentYearInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
        console.log(`\nCALCULATED REVENUE: ${totalRevenue}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

connectDB();
