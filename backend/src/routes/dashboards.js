import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import Program from '../models/Program.js';
import Deal from '../models/Deal.js';
import Invoice from '../models/Invoice.js';
import Receivable from '../models/Receivable.js';
import Payable from '../models/Payable.js';
import Governance from '../models/Governance.js';
import RevenueTarget from '../models/RevenueTarget.js';
import { generateAIInsight } from '../utils/aiInsights.js';

const router = express.Router();

router.get('/operations', authenticate, authorize('Operations Manager'), async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const DealRequest = (await import('../models/DealRequest.js')).default;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysSessions = await Program.find({
      'sessionDates.sessionDate': {
        $gte: today,
        $lt: tomorrow
      }
    }).populate('primaryTrainer backupTrainer');

    const upcomingPrograms = await Program.find({
      startDate: { $gte: today }
    }).sort({ startDate: 1 }).limit(10).populate('primaryTrainer');

    // Pending Approvals - from Programs (sign-offs)
    const pendingProgramSignoffs = await Program.find({
      $or: [
        { trainerSignOff: false },
        { clientSignOff: false }
      ],
      deliveryStatus: { $in: ['In Progress', 'Completed'] }
    }).populate('primaryTrainer');

    // Format pending approvals with source
    const pendingApprovals = pendingProgramSignoffs.map(program => {
      const sources = [];
      if (!program.trainerSignOff) sources.push('Trainer Sign-off');
      if (!program.clientSignOff) sources.push('Client Sign-off');

      return {
        _id: program._id,
        source: 'Program',
        sourceId: program.programName || program._id,
        sourceName: program.programName,
        clientName: program.clientName,
        pendingItems: sources,
        createdAt: program.createdAt,
        updatedAt: program.updatedAt
      };
    });

    const deliveryRisks = await Program.find({
      deliveryStatus: { $in: ['On Hold', 'Cancelled'] },
      deviationReason: { $exists: true, $ne: '' }
    });

    // Opportunities sent to delivery
    const Opportunity = (await import('../models/Opportunity.js')).default;
    const opportunitiesForDelivery = await Opportunity.find({
      opportunityStatus: 'Sent to Delivery'
    })
      .populate('salesExecutiveId', 'name email')
      .populate('salesManagerId', 'name email')
      .sort({ sentToDeliveryAt: -1 });

    // All opportunities (for real-time visibility)
    const allOpportunities = await Opportunity.find({})
      .populate('salesExecutiveId', 'name email')
      .populate('salesManagerId', 'name email')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      todaysSessions: todaysSessions || [],
      upcomingPrograms: upcomingPrograms || [],
      pendingApprovals: pendingApprovals || [],
      deliveryRisks: deliveryRisks || [],
      opportunitiesForDelivery: opportunitiesForDelivery || [],
      recentOpportunities: allOpportunities || []
    });
  } catch (error) {
    console.error('Error in operations dashboard:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch dashboard data' });
  }
});

router.get('/business', authenticate, authorize('Business Head'), async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const TaxEngine = (await import('../models/TaxEngine.js')).default;
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;
    const previousYear = currentYear - 2;

    const currentYearStart = new Date(currentYear, 0, 1);
    const lastYearStart = new Date(lastYear, 0, 1);
    const previousYearStart = new Date(previousYear, 0, 1);

    const currentYearInvoices = await Invoice.find({
      invoiceDate: { $gte: currentYearStart }
    });

    const lastYearInvoices = await Invoice.find({
      invoiceDate: { $gte: lastYearStart, $lt: currentYearStart }
    });

    const previousYearInvoices = await Invoice.find({
      invoiceDate: { $gte: previousYearStart, $lt: lastYearStart }
    });

    const currentRevenue = currentYearInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const lastYearRevenue = lastYearInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const previousYearRevenue = previousYearInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

    const revenueGrowth = lastYearRevenue > 0
      ? ((currentRevenue - lastYearRevenue) / lastYearRevenue) * 100
      : 0;

    const revenueByMonth = {};
    currentYearInvoices.forEach(inv => {
      const month = inv.invoiceDate.getMonth();
      revenueByMonth[month] = (revenueByMonth[month] || 0) + inv.totalAmount;
    });

    const revenueByClient = {};
    currentYearInvoices.forEach(inv => {
      revenueByClient[inv.clientName] = (revenueByClient[inv.clientName] || 0) + inv.totalAmount;
    });

    const topClients = Object.entries(revenueByClient)
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const allClients = [...new Set(currentYearInvoices.map(inv => inv.clientName))];
    const inactiveClients = allClients.filter(client => {
      const lastInvoice = currentYearInvoices
        .filter(inv => inv.clientName === client)
        .sort((a, b) => b.invoiceDate - a.invoiceDate)[0];
      if (!lastInvoice) return true;
      const daysSince = (Date.now() - lastInvoice.invoiceDate) / (1000 * 60 * 60 * 24);
      return daysSince > 90;
    });

    const lossDeals = await Deal.find({
      grossMarginPercent: { $lt: 10 }
    });

    const profitSummary = await Deal.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalOrderValue' },
          totalCost: { $sum: { $add: ['$trainerCost', '$labCost', '$logisticsCost', '$contentCost', '$contingencyBuffer'] } },
          avgMargin: { $avg: '$grossMarginPercent' }
        }
      }
    ]);

    // TDS Impact on Margin
    const tdsImpact = await TaxEngine.aggregate([
      {
        $group: {
          _id: null,
          totalTds: { $sum: '$tdsAmount' }
        }
      }
    ]);

    const marginImpact = tdsImpact[0]?.totalTds || 0;

    // Calculate pipeline metrics for Business Head
    const Opportunity = (await import('../models/Opportunity.js')).default;
    const allOpportunities = await Opportunity.find({})
      .populate('salesExecutiveId', 'name email')
      .populate('salesManagerId', 'name email')
      .sort({ createdAt: -1 });

    const pipeline = {
      new: allOpportunities.filter(o => o.opportunityStatus === 'New').length,
      qualified: allOpportunities.filter(o => o.opportunityStatus === 'Qualified').length,
      sentToDelivery: allOpportunities.filter(o => o.opportunityStatus === 'Sent to Delivery').length,
      converted: allOpportunities.filter(o => o.opportunityStatus === 'Converted to Deal').length,
      lost: allOpportunities.filter(o => o.opportunityStatus === 'Lost').length
    };

    // Check for low GP deals (< 15%) - Business Head alert
    // Using Deal model because it has the verified GP calculation
    const lowGPDeals = await Deal.find({
      grossMarginPercent: { $lt: 15 }
    })
      .select('dealId clientName grossMarginPercent totalOrderValue')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Check for low GP Opportunities (< 15%) - Business Head alert
    const lowGPOpps = await Opportunity.find({
      gpPercent: { $lt: 15 },
      opportunityStatus: { $nin: ['Lost', 'Dropped'] }
    })
      .select('opportunityId billingClient gpPercent finalGP tov expectedCommercialValue')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const lowGPAlerts = [
      ...lowGPDeals.map(deal => ({
        opportunityId: deal.dealId,
        billingClient: deal.clientName,
        endClient: deal.clientName,
        finalGP: (deal.totalOrderValue * deal.grossMarginPercent) / 100,
        tov: deal.totalOrderValue,
        gpPercent: deal.grossMarginPercent,
        type: 'Deal'
      })),
      ...lowGPOpps.map(opp => ({
        opportunityId: opp.opportunityId,
        billingClient: opp.billingClient,
        endClient: opp.billingClient,
        finalGP: opp.finalGP,
        tov: opp.tov || opp.expectedCommercialValue,
      }))
    ];

    // User Logic: "Just need at the time the director set amount alone be shown"
    // Fetch all targets for the year (GLOBAL), sort by modification time (DESC), and pick the top one.
    const targets = await RevenueTarget.find({ year: currentYear });

    // Sort desc by updatedAt
    const latestTarget = targets.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];

    const effectiveTarget = latestTarget ? latestTarget.amount : 0;

    const aiInsight = await generateAIInsight({
      currentRevenue,
      lastYearRevenue,
      revenueGrowth,
      topClients: topClients.length,
      tdsImpact: marginImpact
    }, 'business metrics');

    res.json({
      revenueTarget: effectiveTarget,
      revenueByMonth: revenueByMonth || {},
      currentRevenue: currentRevenue || 0,
      lastYearRevenue: lastYearRevenue || 0,
      previousYearRevenue: previousYearRevenue || 0,
      revenueGrowth: revenueGrowth ? revenueGrowth.toFixed(2) : '0.00',
      topClients: topClients || [],
      inactiveClients: inactiveClients || [],
      profitSummary: profitSummary[0] || {},
      lossDeals: lossDeals || [],
      tdsImpactOnMargin: marginImpact || 0,
      pipeline: pipeline || { new: 0, qualified: 0, sentToDelivery: 0, converted: 0, lost: 0 },
      lowGPAlerts: lowGPAlerts || [],
      aiInsight: aiInsight || ''
    });
  } catch (error) {
    console.error('Error in business dashboard:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch dashboard data' });
  }
});

router.get('/finance', authenticate, authorize('Finance Manager'), async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const TaxEngine = (await import('../models/TaxEngine.js')).default;

    const pendingInvoices = await Invoice.find({
      status: { $in: ['Draft', 'Generated', 'Sent'] }
    }).sort({ invoiceDate: -1 });

    const overdueReceivables = await Receivable.find({
      status: 'Overdue'
    }).populate('invoiceId');

    const totalReceivables = await Receivable.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$outstandingAmount' }
        }
      }
    ]);

    const totalPayables = await Payable.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$outstandingAmount' }
        }
      }
    ]);

    const cashPosition = (totalReceivables[0]?.total || 0) - (totalPayables[0]?.total || 0);

    const taxCompliance = await Invoice.find({
      irnNumber: { $exists: true, $ne: null },
      ewayBillNumber: { $exists: true, $ne: null }
    });

    // TDS Breakdown
    const tdsBreakdown = await TaxEngine.find()
      .populate('vendorId', 'vendorName panNumber')
      .populate('payableId')
      .sort({ createdAt: -1 })
      .limit(20);

    const tdsSummary = await TaxEngine.aggregate([
      {
        $group: {
          _id: '$tdsSection',
          totalTds: { $sum: '$tdsAmount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const nonCompliantTds = await TaxEngine.countDocuments({
      complianceStatus: { $in: ['Non-Compliant', 'Pending PAN'] }
    });

    // All opportunities (for real-time visibility)
    const Opportunity = (await import('../models/Opportunity.js')).default;
    const allOpportunities = await Opportunity.find({})
      .populate('salesExecutiveId', 'name email')
      .populate('salesManagerId', 'name email')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      pendingInvoices: pendingInvoices || [],
      overdueReceivables: overdueReceivables || [],
      taxComplianceStatus: {
        total: taxCompliance ? taxCompliance.length : 0,
        compliant: taxCompliance ? taxCompliance.filter(inv => inv.irnNumber && inv.ewayBillNumber).length : 0
      },
      cashPosition: cashPosition || 0,
      tdsBreakdown: tdsBreakdown || [],
      tdsSummary: tdsSummary || [],
      nonCompliantTds: nonCompliantTds || 0,
      recentOpportunities: allOpportunities || []
    });
  } catch (error) {
    console.error('Error in finance dashboard:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch dashboard data' });
  }
});

router.get('/director', authenticate, authorize('Director'), async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const totalReceivables = await Receivable.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$outstandingAmount' }
        }
      }
    ]);

    const totalPayables = await Payable.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$outstandingAmount' }
        }
      }
    ]);

    const revenue = await Invoice.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' }
        }
      }
    ]);

    const expenses = await Payable.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$paidAmount' }
        }
      }
    ]);

    const riskAlerts = await Governance.find({
      $or: [
        { lossMakingProjectFlag: true },
        { fraudAlertType: { $ne: 'None' } }
      ]
    }).populate('dealId programId').limit(10);

    const profitLoss = (revenue[0]?.total || 0) - (expenses[0]?.total || 0);

    // All opportunities (for real-time visibility)
    const Opportunity = (await import('../models/Opportunity.js')).default;
    const allOpportunities = await Opportunity.find({})
      .populate('salesExecutiveId', 'name email')
      .populate('salesManagerId', 'name email')
      .sort({ createdAt: -1 })
      .limit(20);

    // Check for very low GP opportunities (< 10%) - Director alert
    // Check for very low GP deals (< 10%) - Director alert
    const veryLowGPDeals = await Deal.find({
      grossMarginPercent: { $lt: 10 }
    })
      .select('dealId clientName grossMarginPercent totalOrderValue')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Check for very low GP Opportunities (< 10%) - Director alert
    const veryLowGPOpps = await Opportunity.find({
      gpPercent: { $lt: 10 },
      opportunityStatus: { $nin: ['Lost', 'Dropped'] }
    })
      .select('opportunityId billingClient gpPercent finalGP tov expectedCommercialValue')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const veryLowGPAlerts = [
      ...veryLowGPDeals.map(deal => ({
        opportunityId: deal.dealId,
        billingClient: deal.clientName,
        endClient: deal.clientName,
        finalGP: (deal.totalOrderValue * deal.grossMarginPercent) / 100,
        tov: deal.totalOrderValue,
        gpPercent: deal.grossMarginPercent,
        type: 'Deal'
      })),
      ...veryLowGPOpps.map(opp => ({
        opportunityId: opp.opportunityId,
        billingClient: opp.billingClient,
        endClient: opp.billingClient, // fallback
        finalGP: opp.finalGP,
        tov: opp.tov || opp.expectedCommercialValue,
        gpPercent: opp.gpPercent,
        type: 'Opportunity'
      }))
    ];

    // Also check Programs with low GP
    const allPrograms = await Program.find({
      tov: { $gt: 0 },
      finalGP: { $exists: true }
    })
      .select('programName courseName billingClient endClient finalGP tov gpPercent')
      .lean();

    const veryLowGPPrograms = allPrograms
      .filter(prog => {
        const gpPercent = (prog.finalGP / prog.tov) * 100;
        return gpPercent < 10;
      })
      .slice(0, 10);

    // Get all revenue targets for current year
    const currentYear = new Date().getFullYear();
    const revenueTargets = await RevenueTarget.find({ year: currentYear })
      .populate('setBy', 'name email')
      .sort({ period: 1, quarter: 1, createdAt: -1 });

    const aiInsight = await generateAIInsight({
      revenue: revenue[0]?.total || 0,
      expenses: expenses[0]?.total || 0,
      profitLoss,
      riskAlerts: riskAlerts.length
    }, 'director overview');

    res.json({
      revenue: revenue[0]?.total || 0,
      expenses: expenses[0]?.total || 0,
      receivables: totalReceivables[0]?.total || 0,
      payables: totalPayables[0]?.total || 0,
      profitLoss: profitLoss || 0,
      riskAlerts: riskAlerts || [],
      revenueTargets: revenueTargets || [],
      recentOpportunities: allOpportunities || [],
      veryLowGPAlerts: [...(veryLowGPAlerts || []), ...(veryLowGPPrograms || [])],
      aiInsight: aiInsight || ''
    });
  } catch (error) {
    console.error('Error in director dashboard:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch dashboard data' });
  }
});

// Sales Executive Dashboard
router.get('/sales-executive', authenticate, authorize('Sales Executive'), async (req, res) => {
  try {
    const Opportunity = (await import('../models/Opportunity.js')).default;
    const Client = (await import('../models/Client.js')).default;

    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get all opportunities created by this sales executive
    const myOpportunities = await Opportunity.find({
      salesExecutiveId: req.user._id
    }).sort({ createdAt: -1 });

    // Get all clients created by this sales executive
    const myClients = await Client.find({
      createdBy: req.user._id
    });

    // Get current revenue target (Yearly for current year)
    const currentYear = new Date().getFullYear();
    // User Logic: "Just need at the time the director set amount alone be shown"
    const targets = await RevenueTarget.find({
      year: currentYear
      // Removed setBy filter to allow SE to see Director's updates (Global Target)
    });

    const latestTarget = targets.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
    const revenueTarget = latestTarget ? latestTarget.amount : 0;
    const leadCapture = myClients.length;
    const opportunities = myOpportunities.length;
    const closures = myOpportunities.filter(o => o.opportunityStatus === 'Converted to Deal').length;

    const pipeline = {
      new: myOpportunities.filter(o => o.opportunityStatus === 'New').length,
      qualified: myOpportunities.filter(o => o.opportunityStatus === 'Qualified').length,
      sentToDelivery: myOpportunities.filter(o => o.opportunityStatus === 'Sent to Delivery').length,
      converted: closures,
      lost: myOpportunities.filter(o => o.opportunityStatus === 'Lost').length
    };

    const totalValue = myOpportunities.reduce((sum, o) => sum + (o.expectedCommercialValue || o.tov || 0), 0);
    const convertedValue = myOpportunities
      .filter(o => o.opportunityStatus === 'Converted to Deal')
      .reduce((sum, o) => sum + (o.expectedCommercialValue || o.tov || 0), 0);

    // All opportunities (for real-time visibility across all roles)
    const allOpportunities = await Opportunity.find({})
      .populate('salesExecutiveId', 'name email')
      .populate('salesManagerId', 'name email')
      .sort({ createdAt: -1 })
      .limit(20);

    // Check for low GP deals (< 15%) - Sales Executive Alert
    const Deal = (await import('../models/Deal.js')).default;
    // Find opportunities owned by this SE, then find corresponding Deals?
    // Deal model doesn't explicitly store salesExecutiveId at top level, it links to Opportunity.
    // However, for efficiency, I will query Deals associated with the user's Opportunities.

    // Get SE's opportunity IDs
    const myOppIds = myOpportunities.map(o => o._id);

    const lowGPDeals = await Deal.find({
      opportunityId: { $in: myOppIds },
      grossMarginPercent: { $lt: 15 }
    })
      .select('dealId clientName grossMarginPercent totalOrderValue')
      .lean();

    const lowGPAlerts = lowGPDeals.map(deal => ({
      opportunityId: deal.dealId,
      billingClient: deal.clientName,
      endClient: deal.clientName,
      finalGP: (deal.totalOrderValue * deal.grossMarginPercent) / 100,
      tov: deal.totalOrderValue,
      gpPercent: deal.grossMarginPercent
    }));

    res.json({
      revenueTarget: revenueTarget || 0,
      leadCapture: leadCapture || 0,
      opportunities: opportunities || 0,
      closures: closures || 0,
      pipeline: pipeline || { new: 0, qualified: 0, sentToDelivery: 0, converted: 0, lost: 0 },
      totalValue: totalValue || 0,
      convertedValue: convertedValue || 0,
      myOpportunities: myOpportunities ? myOpportunities.slice(0, 10) : [],
      recentOpportunities: allOpportunities || [],
      lowGPAlerts: lowGPAlerts || []
    });
  } catch (error) {
    console.error('Error in sales-executive dashboard:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch dashboard data' });
  }
});

// Sales Manager Dashboard
router.get('/sales-manager', authenticate, authorize('Sales Manager'), async (req, res) => {
  try {
    const Opportunity = (await import('../models/Opportunity.js')).default;

    // Sales Manager sees all opportunities (created by Sales Executive or Sales Manager)
    const allOpportunities = await Opportunity.find({})
      .populate('salesExecutiveId', 'name email')
      .populate('salesManagerId', 'name email')
      .sort({ createdAt: -1 });

    const pipeline = {
      new: allOpportunities.filter(o => o.opportunityStatus === 'New').length,
      qualified: allOpportunities.filter(o => o.opportunityStatus === 'Qualified').length,
      sentToDelivery: allOpportunities.filter(o => o.opportunityStatus === 'Sent to Delivery').length,
      converted: allOpportunities.filter(o => o.opportunityStatus === 'Converted to Deal').length,
      lost: allOpportunities.filter(o => o.opportunityStatus === 'Lost').length
    };

    const totalValue = allOpportunities.reduce((sum, o) => sum + (o.expectedCommercialValue || 0), 0);
    const convertedValue = allOpportunities
      .filter(o => o.opportunityStatus === 'Converted to Deal')
      .reduce((sum, o) => sum + (o.expectedCommercialValue || 0), 0);

    const pendingQualification = allOpportunities.filter(o => o.opportunityStatus === 'New');

    // Get current revenue target (Yearly for current year)
    const currentYear = new Date().getFullYear();
    // User Logic: "Just need at the time the director set amount alone be shown"
    const targets = await RevenueTarget.find({ year: currentYear });

    const latestTarget = targets.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
    const revenueTarget = latestTarget ? latestTarget.amount : 0;

    res.json({
      revenueTarget: revenueTarget || 0,
      pipeline: pipeline || { new: 0, qualified: 0, sentToDelivery: 0, converted: 0, lost: 0 },
      totalValue: totalValue || 0,
      convertedValue: convertedValue || 0,
      pendingQualification: pendingQualification ? pendingQualification.slice(0, 10) : [],
      recentOpportunities: allOpportunities ? allOpportunities.slice(0, 20) : []
    });
  } catch (error) {
    console.error('Error in sales-manager dashboard:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch dashboard data' });
  }
});


export default router;
