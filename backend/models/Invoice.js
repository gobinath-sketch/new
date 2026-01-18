import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  clientInvoiceNumber: {
    type: String,
    unique: true,
    required: true
  },
  clientPOUpload: {
    type: String
  },
  clientPOOCRExtractedData: {
    type: mongoose.Schema.Types.Mixed
  },
  vendorInvoiceUpload: {
    type: String
  },
  vendorInvoiceOCRExtractedData: {
    type: mongoose.Schema.Types.Mixed
  },
  threeWayMatchStatus: {
    type: String,
    enum: ['Matched', 'Mismatched', 'Pending'],
    default: 'Pending'
  },
  overbillingFlag: {
    type: Boolean,
    default: false
  },
  duplicateFlag: {
    type: Boolean,
    default: false
  },
  gstType: {
    type: String,
    enum: ['IGST', 'CGST', 'SGST', 'CGST+SGST'],
    required: true
  },
  gstPercent: {
    type: Number,
    required: true
  },
  sacCode: {
    type: String,
    required: true
  },
  tdsPercent: {
    type: Number,
    default: 0
  },
  tdsAmount: {
    type: Number,
    default: 0
  },
  irnNumber: {
    type: String,
    unique: true
  },
  ewayBillNumber: {
    type: String,
    unique: true
  },
  invoiceDate: {
    type: Date,
    required: true
  },
  invoiceAmount: {
    type: Number,
    required: true
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  clientName: {
    type: String,
    required: true
  },
  programId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program'
  },
  dealId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deal'
  },
  bocId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BOC'
  },
  status: {
    type: String,
    enum: ['Draft', 'Generated', 'Sent', 'Paid', 'Overdue', 'Cancelled'],
    default: 'Draft'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

invoiceSchema.pre('validate', async function(next) {
  try {
    // Use AI for invoice calculation
    const { calculateInvoiceWithAI } = await import('../utils/aiDecisionEngine.js');
    const invoiceCalc = await calculateInvoiceWithAI({
      invoiceAmount: this.invoiceAmount,
      gstType: this.gstType,
      gstPercent: this.gstPercent,
      sacCode: this.sacCode,
      tdsPercent: this.tdsPercent || 0
    });
    
    this.taxAmount = invoiceCalc.taxAmount;
    this.totalAmount = invoiceCalc.totalAmount;
    this.tdsAmount = invoiceCalc.tdsAmount;
    next();
  } catch (error) {
    // Fallback to simple calculation if AI fails
    if (this.invoiceAmount !== undefined && this.gstPercent !== undefined) {
      this.taxAmount = (this.invoiceAmount * this.gstPercent) / 100;
      this.totalAmount = this.invoiceAmount + this.taxAmount;
    } else if (this.invoiceAmount !== undefined) {
      this.totalAmount = this.invoiceAmount;
      this.taxAmount = 0;
    }
    next();
  }
});

invoiceSchema.pre('save', async function(next) {
  try {
    // Use AI for invoice calculation if not already set
    if (!this.totalAmount && this.invoiceAmount !== undefined) {
      const { calculateInvoiceWithAI } = await import('../utils/aiDecisionEngine.js');
      const invoiceCalc = await calculateInvoiceWithAI({
        invoiceAmount: this.invoiceAmount,
        gstType: this.gstType,
        gstPercent: this.gstPercent,
        sacCode: this.sacCode,
        tdsPercent: this.tdsPercent || 0
      });
      
      this.taxAmount = invoiceCalc.taxAmount;
      this.totalAmount = invoiceCalc.totalAmount;
      this.tdsAmount = invoiceCalc.tdsAmount;
    }
    this.updatedAt = Date.now();
    next();
  } catch (error) {
    // Fallback to simple calculation if AI fails
    if (!this.totalAmount && this.invoiceAmount !== undefined) {
      if (this.gstPercent !== undefined) {
        this.taxAmount = (this.invoiceAmount * this.gstPercent) / 100;
        this.totalAmount = this.invoiceAmount + this.taxAmount;
      } else {
        this.totalAmount = this.invoiceAmount;
        this.taxAmount = 0;
      }
    }
    
    if (this.tdsPercent > 0 && this.totalAmount) {
      this.tdsAmount = (this.totalAmount * this.tdsPercent) / 100;
    }
    this.updatedAt = Date.now();
    next();
  }
});

export default mongoose.model('Invoice', invoiceSchema);
