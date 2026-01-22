import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Vendor from '../models/Vendor.js';
import Deal from '../models/Deal.js';
import DealRequest from '../models/DealRequest.js';
import Program from '../models/Program.js';
import Material from '../models/Material.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import Invoice from '../models/Invoice.js';
import Payable from '../models/Payable.js';
import Receivable from '../models/Receivable.js';
// Note: Using fixed IDs for test data consistency

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../config.env') });

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'GKT-ERP'
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing test data (optional - comment out for production)
    // await Vendor.deleteMany({});
    // await Deal.deleteMany({});
    // await Program.deleteMany({});

    // 1. SEED VENDORS
    console.log('\n📦 Seeding Vendors...');
    
    const vendor1 = await Vendor.findOneAndUpdate(
      { panNumber: 'ABCPK1234L' },
      {
        vendorType: 'Individual',
        vendorName: 'Ramesh Kumar',
        panNumber: 'ABCPK1234L',
        gstNumber: '',
        bankAccountNumber: '1234567890123456',
        ifscCode: 'HDFC0001234',
        bankName: 'HDFC Bank',
        address: '123 Main Street, Chennai, Tamil Nadu 600001',
        contactPersonName: 'Ramesh Kumar',
        email: 'ramesh.kumar@email.com',
        phone: '9876543210',
        status: 'Active',
        blacklistFlag: false
      },
      { upsert: true, new: true }
    );

    const vendor2 = await Vendor.findOneAndUpdate(
      { panNumber: 'AACCS8899P' },
      {
        vendorType: 'Company',
        vendorName: 'SkillEdge Solutions Pvt Ltd',
        panNumber: 'AACCS8899P',
        gstNumber: '29AACCS8899P1Z1',
        bankAccountNumber: '9876543210987654',
        ifscCode: 'ICIC0009876',
        bankName: 'ICICI Bank',
        address: '456 Tech Park, Bangalore, Karnataka 560001',
        contactPersonName: 'Rajesh Sharma',
        email: 'contact@skilledge.com',
        phone: '9876543211',
        status: 'Active',
        blacklistFlag: false
      },
      { upsert: true, new: true }
    );

    const vendor3 = await Vendor.findOneAndUpdate(
      { panNumber: 'AABCD7788Q' },
      {
        vendorType: 'Company',
        vendorName: 'DataMind Consulting LLP',
        panNumber: 'AABCD7788Q',
        gstNumber: '27AABCD7788Q1Z9',
        bankAccountNumber: '1111222233334444',
        ifscCode: 'SBIN0001111',
        bankName: 'State Bank of India',
        address: '789 Business Center, Mumbai, Maharashtra 400001',
        contactPersonName: 'Priya Patel',
        email: 'info@datamind.com',
        phone: '9876543212',
        status: 'Active',
        blacklistFlag: false
      },
      { upsert: true, new: true }
    );

    const vendor4 = await Vendor.findOneAndUpdate(
      { email: 'unknown.trainer@email.com' },
      {
        vendorType: 'Individual',
        vendorName: 'Unknown Trainer',
        panNumber: '', // NOT PROVIDED - triggers 20% TDS
        gstNumber: '',
        bankAccountNumber: '5555666677778888',
        ifscCode: 'AXIS0005555',
        bankName: 'Axis Bank',
        address: '321 Local Road, Chennai, Tamil Nadu 600002',
        contactPersonName: 'Unknown Trainer',
        email: 'unknown.trainer@email.com',
        phone: '9876543213',
        status: 'Active',
        blacklistFlag: false
      },
      { upsert: true, new: true }
    );

    console.log('✅ Vendors seeded');

    // 2. SEED DEALS
    console.log('\n💼 Seeding Deals...');

    const deal1 = await Deal.findOneAndUpdate(
      { dealId: 'DEAL-HIGH-01' },
      {
        dealId: 'DEAL-HIGH-01',
        clientName: 'Infosys Ltd',
        dealType: 'Training',
        revenueCategory: 'Corporate',
        totalOrderValue: 1000000,
        trainerCost: 250000,
        labCost: 200000,
        logisticsCost: 150000,
        contentCost: 100000,
        contingencyBuffer: 50000,
        approvalStatus: 'Approved',
        approvalTimestamp: new Date(),
        marginThresholdStatus: 'Above Threshold'
      },
      { upsert: true, new: true, runValidators: true }
    );

    const deal2 = await Deal.findOneAndUpdate(
      { dealId: 'DEAL-MID-01' },
      {
        dealId: 'DEAL-MID-01',
        clientName: 'IIT Madras',
        dealType: 'Enablement',
        revenueCategory: 'Academic',
        totalOrderValue: 500000,
        trainerCost: 150000,
        labCost: 120000,
        logisticsCost: 80000,
        contentCost: 60000,
        contingencyBuffer: 30000,
        approvalStatus: 'Approved',
        approvalTimestamp: new Date(),
        marginThresholdStatus: 'At Threshold'
      },
      { upsert: true, new: true, runValidators: true }
    );

    const deal3 = await Deal.findOneAndUpdate(
      { dealId: 'DEAL-LOW-01' },
      {
        dealId: 'DEAL-LOW-01',
        clientName: 'ABC Public School',
        dealType: 'Consulting',
        revenueCategory: 'School',
        totalOrderValue: 300000,
        trainerCost: 100000,
        labCost: 80000,
        logisticsCost: 50000,
        contentCost: 35000,
        contingencyBuffer: 20000,
        approvalStatus: 'Approved',
        approvalTimestamp: new Date(),
        marginThresholdStatus: 'Below Threshold',
        exceptionJustification: 'Strategic client relationship'
      },
      { upsert: true, new: true, runValidators: true }
    );

    console.log('✅ Deals seeded');

    // 3. SEED PROGRAMS
    console.log('\n🗓️ Seeding Programs...');

    const program1 = await Program.findOneAndUpdate(
      { programCode: 'PGM-001' },
      {
        programName: 'Advanced Java Training',
        programCode: 'PGM-001',
        sacCode: '998314',
        clientName: 'Infosys Ltd',
        batchName: 'Batch-01',
        batchCapacity: 30,
        startDate: new Date('2024-01-20'),
        endDate: new Date('2024-01-25'),
        deliveryMode: 'Onsite',
        location: 'Chennai, Tamil Nadu',
        primaryTrainer: vendor1._id,
        backupTrainer: vendor3._id,
        labPlatformName: 'Java Lab Platform',
        deliveryStatus: 'In Progress',
        trainerSignOff: true,
        trainerSignOffDate: new Date('2024-01-19'),
        clientSignOff: false
      },
      { upsert: true, new: true }
    );

    const program2 = await Program.findOneAndUpdate(
      { programCode: 'PGM-002' },
      {
        programName: 'Data Science Bootcamp',
        programCode: 'PGM-002',
        sacCode: '998314',
        clientName: 'IIT Madras',
        batchName: 'Batch-01',
        batchCapacity: 25,
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-15'),
        deliveryMode: 'Virtual',
        location: 'Online',
        primaryTrainer: vendor3._id,
        labPlatformName: 'Data Science Lab',
        deliveryStatus: 'Scheduled',
        trainerSignOff: false,
        clientSignOff: false
      },
      { upsert: true, new: true }
    );

    const program3 = await Program.findOneAndUpdate(
      { programCode: 'PGM-003' },
      {
        programName: 'IT Consulting Support',
        programCode: 'PGM-003',
        sacCode: '998314',
        clientName: 'ABC Public School',
        batchName: 'Batch-01',
        batchCapacity: 10,
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-01-30'),
        deliveryMode: 'Hybrid',
        location: 'Chennai, Tamil Nadu',
        primaryTrainer: vendor4._id,
        labPlatformName: 'Consulting Platform',
        deliveryStatus: 'Scheduled',
        trainerSignOff: false,
        clientSignOff: false
      },
      { upsert: true, new: true }
    );

    console.log('✅ Programs seeded');

    // 4. SEED MATERIALS
    console.log('\n📦 Seeding Materials...');

    const material1 = await Material.findOneAndUpdate(
      { programId: program1._id, materialName: 'Training Kits' },
      {
        programId: program1._id,
        materialName: 'Training Kits',
        quantityRequired: 30,
        availableStock: 30,
        materialCost: 30000,
        courierPartner: 'BlueDart',
        dispatchDate: new Date('2024-01-18'),
        trackingNumber: 'BD123456789',
        materialStatus: 'Delivered'
      },
      { upsert: true, new: true }
    );

    const material2 = await Material.findOneAndUpdate(
      { programId: program2._id, materialName: 'Learning Kits' },
      {
        programId: program2._id,
        materialName: 'Learning Kits',
        quantityRequired: 25,
        availableStock: 25,
        materialCost: 20000,
        courierPartner: 'DTDC',
        dispatchDate: new Date('2024-01-28'),
        trackingNumber: 'DTDC987654321',
        materialStatus: 'In Transit'
      },
      { upsert: true, new: true }
    );

    console.log('✅ Materials seeded');

    // 5. SEED PURCHASE ORDERS
    console.log('\n🧾 Seeding Purchase Orders...');

    const po1 = await PurchaseOrder.findOneAndUpdate(
      { internalPONumber: 'PO-001' },
      {
        internalPONumber: 'PO-001',
        vendorId: vendor1._id,
        dealId: deal1._id,
        programId: program1._id,
        approvedCost: 250000,
        adjustedPayableAmount: 250000,
        status: 'Issued',
        costLockFlag: true
      },
      { upsert: true, new: true }
    );

    const po2 = await PurchaseOrder.findOneAndUpdate(
      { internalPONumber: 'PO-002' },
      {
        internalPONumber: 'PO-002',
        vendorId: vendor3._id,
        dealId: deal2._id,
        programId: program2._id,
        approvedCost: 100000,
        adjustedPayableAmount: 100000,
        status: 'Issued'
      },
      { upsert: true, new: true }
    );

    const po3 = await PurchaseOrder.findOneAndUpdate(
      { internalPONumber: 'PO-003' },
      {
        internalPONumber: 'PO-003',
        vendorId: vendor4._id,
        dealId: deal3._id,
        programId: program3._id,
        approvedCost: 50000,
        adjustedPayableAmount: 50000,
        status: 'Issued'
      },
      { upsert: true, new: true }
    );

    console.log('✅ Purchase Orders seeded');

    // 6. SEED PAYABLES
    console.log('\n💰 Seeding Payables...');

    const payable1 = await Payable.findOneAndUpdate(
      { vendorPayoutReference: 'PAY-001' },
      {
        purchaseOrderId: po1._id,
        vendorId: vendor1._id,
        vendorName: vendor1.vendorName,
        vendorPayoutReference: 'PAY-001',
        approvedCost: 250000,
        adjustedPayableAmount: 250000,
        paymentTerms: 30,
        paymentMode: 'NEFT',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        outstandingAmount: 250000,
        status: 'Pending',
        reconciliationStatus: 'Pending'
      },
      { upsert: true, new: true }
    );

    const payable2 = await Payable.findOneAndUpdate(
      { vendorPayoutReference: 'PAY-002' },
      {
        purchaseOrderId: po2._id,
        vendorId: vendor3._id,
        vendorName: vendor3.vendorName,
        vendorPayoutReference: 'PAY-002',
        approvedCost: 100000,
        adjustedPayableAmount: 100000,
        paymentTerms: 30,
        paymentMode: 'RTGS',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        outstandingAmount: 100000,
        status: 'Pending',
        reconciliationStatus: 'Pending'
      },
      { upsert: true, new: true }
    );

    const payable3 = await Payable.findOneAndUpdate(
      { vendorPayoutReference: 'PAY-003' },
      {
        purchaseOrderId: po3._id,
        vendorId: vendor4._id,
        vendorName: vendor4.vendorName,
        vendorPayoutReference: 'PAY-003',
        approvedCost: 50000,
        adjustedPayableAmount: 50000,
        paymentTerms: 30,
        paymentMode: 'IMPS',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        outstandingAmount: 50000,
        status: 'Pending',
        reconciliationStatus: 'Pending'
      },
      { upsert: true, new: true }
    );

    console.log('✅ Payables seeded');

    // 7. SEED INVOICES
    console.log('\n🧾 Seeding Invoices...');

    const invoice1 = await Invoice.findOneAndUpdate(
      { clientInvoiceNumber: 'INV-001' },
      {
        clientInvoiceNumber: 'INV-001',
        clientName: 'Infosys Ltd',
        programId: program1._id,
        dealId: deal1._id,
        invoiceDate: new Date('2024-01-20'),
        invoiceAmount: 1000000,
        gstType: 'IGST',
        gstPercent: 18,
        sacCode: '998314',
        tdsPercent: 10,
        taxAmount: 180000,
        totalAmount: 1180000,
        tdsAmount: 100000,
        status: 'Generated',
        irnNumber: 'IRN001', // Unique IRN for test data
        ewayBillNumber: 'EWB001' // Unique EWB for test data
      },
      { upsert: true, new: true, runValidators: true }
    );

    const invoice2 = await Invoice.findOneAndUpdate(
      { clientInvoiceNumber: 'INV-002' },
      {
        clientInvoiceNumber: 'INV-002',
        clientName: 'IIT Madras',
        programId: program2._id,
        dealId: deal2._id,
        invoiceDate: new Date('2024-02-01'),
        invoiceAmount: 500000,
        gstType: 'CGST+SGST',
        gstPercent: 18, // 9% CGST + 9% SGST
        sacCode: '998314',
        tdsPercent: 2,
        taxAmount: 90000,
        totalAmount: 590000,
        tdsAmount: 10000,
        status: 'Paid',
        irnNumber: 'IRN002', // Unique IRN for test data
        ewayBillNumber: 'EWB002' // Unique EWB for test data
      },
      { upsert: true, new: true, runValidators: true }
    );

    const invoice3 = await Invoice.findOneAndUpdate(
      { clientInvoiceNumber: 'INV-003' },
      {
        clientInvoiceNumber: 'INV-003',
        clientName: 'ABC Public School',
        programId: program3._id,
        dealId: deal3._id,
        invoiceDate: new Date('2024-01-15'),
        invoiceAmount: 25000,
        gstType: 'IGST',
        gstPercent: 0, // Not GST registered
        sacCode: '998314',
        tdsPercent: 0, // Below threshold
        taxAmount: 0,
        totalAmount: 25000,
        tdsAmount: 0,
        status: 'Overdue',
        irnNumber: 'IRN003', // Unique IRN for test data
        ewayBillNumber: 'EWB003' // Unique EWB for test data
      },
      { upsert: true, new: true, runValidators: true }
    );

    console.log('✅ Invoices seeded');

    // 8. SEED RECEIVABLES
    console.log('\n💰 Seeding Receivables...');

    const receivable1 = await Receivable.findOneAndUpdate(
      { invoiceNumber: 'INV-001' },
      {
        invoiceId: invoice1._id,
        invoiceNumber: 'INV-001',
        clientName: 'Infosys Ltd',
        invoiceAmount: 1180000, // Total amount including GST
        paymentTerms: 30,
        lateFeePerDay: 0,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        outstandingAmount: 1180000,
        paidAmount: 0,
        status: 'Pending'
      },
      { upsert: true, new: true }
    );

    const receivable2 = await Receivable.findOneAndUpdate(
      { invoiceNumber: 'INV-002' },
      {
        invoiceId: invoice2._id,
        invoiceNumber: 'INV-002',
        clientName: 'IIT Madras',
        invoiceAmount: 590000, // Total amount including GST
        paymentTerms: 30,
        lateFeePerDay: 0,
        dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        outstandingAmount: 0,
        paidAmount: 590000,
        status: 'Paid'
      },
      { upsert: true, new: true }
    );

    const receivable3 = await Receivable.findOneAndUpdate(
      { invoiceNumber: 'INV-003' },
      {
        invoiceId: invoice3._id,
        invoiceNumber: 'INV-003',
        clientName: 'ABC Public School',
        invoiceAmount: 25000,
        paymentTerms: 30,
        lateFeePerDay: 100,
        dueDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days overdue
        outstandingAmount: 25000,
        paidAmount: 0,
        status: 'Overdue'
      },
      { upsert: true, new: true }
    );

    console.log('✅ Receivables seeded');

    // 9. SEED DEAL REQUESTS
    console.log('\n📋 Seeding Deal Requests...');

    const dealRequest1 = await DealRequest.findOneAndUpdate(
      { dealId: 'DRQ-HIGH-01' },
      {
        dealId: 'DRQ-HIGH-01',
        clientName: 'Infosys Ltd',
        offeringType: 'Training',
        expectedStartDate: new Date('2024-01-20'),
        expectedEndDate: new Date('2024-01-25'),
        expectedRevenue: 1000000,
        dealApprovalStatus: 'Approved',
        opsAcknowledgementStatus: 'Acknowledged',
        financeReadinessStatus: 'Ready'
      },
      { upsert: true, new: true }
    );

    console.log('✅ Deal Requests seeded');

    console.log('\n✅ All test data seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Vendors: 4`);
    console.log(`   - Deals: 3`);
    console.log(`   - Programs: 3`);
    console.log(`   - Materials: 2`);
    console.log(`   - Purchase Orders: 3`);
    console.log(`   - Payables: 3`);
    console.log(`   - Invoices: 3`);
    console.log(`   - Receivables: 3`);
    console.log(`   - Deal Requests: 1`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedData();
