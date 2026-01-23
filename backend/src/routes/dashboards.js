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

router.get('/operations/vendor-stats', authenticate, authorize('Operations Manager'), async (req, res) => {
  try {
    const yearStr = String(req.query.year || '').trim();
    const match = yearStr.match(/^(\d{4})-(\d{4})$/);
    if (!match) {
      return res.status(400).json({ error: 'year must be in format YYYY-YYYY (fiscal year)' });
    }

    const startYear = Number(match[1]);
    const endYear = Number(match[2]);
    const start = new Date(startYear, 3, 1);
    const end = new Date(endYear, 2, 31, 23, 59, 59, 999);

    const payables = await Payable.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$vendorName',
          amount: { $sum: '$adjustedPayableAmount' }
        }
      },
      { $sort: { amount: -1 } },
      { $limit: 5 }
    ]);

    res.json((payables || []).map((v) => ({
      name: v._id || 'Unknown',
      revenue: Number(v.amount || 0)
    })));
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch vendor stats' });
  }
});

router.get('/operations/gp-stats', authenticate, authorize('Operations Manager'), async (req, res) => {
  try {
    const yearStr = String(req.query.year || '').trim();
    const match = yearStr.match(/^(\d{4})-(\d{4})$/);
    if (!match) {
      return res.status(400).json({ error: 'year must be in format YYYY-YYYY (fiscal year)' });
    }

    const startYear = Number(match[1]);
    const endYear = Number(match[2]);

    const Opportunity = (await import('../models/Opportunity.js')).default;

    const aprToDec = ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const janToMar = ['January', 'February', 'March'];

    const opps = await Opportunity.find({
      $or: [
        { trainingYear: startYear, trainingMonth: { $in: aprToDec } },
        { trainingYear: endYear, trainingMonth: { $in: janToMar } }
      ]
    }).select('trainingMonth trainingYear gpPercent');

    const order = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    const nameMap = {
      January: 'Jan', February: 'Feb', March: 'Mar', April: 'Apr', May: 'May', June: 'Jun',
      July: 'Jul', August: 'Aug', September: 'Sep', October: 'Oct', November: 'Nov', December: 'Dec'
    };

    const buckets = new Map(order.map((m) => [m, { sum: 0, count: 0 }]));
    (opps || []).forEach((o) => {
      const key = nameMap[o.trainingMonth];
      if (!key || !buckets.has(key)) return;
      const gp = Number(o.gpPercent);
      if (!Number.isFinite(gp)) return;
      const b = buckets.get(key);
      b.sum += gp;
      b.count += 1;
    });

    const out = order.map((m) => {
      const b = buckets.get(m);
      const avg = b && b.count > 0 ? b.sum / b.count : 0;
      return { name: m, gp: Number(avg.toFixed(2)) };
    });

    res.json(out);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch GP stats' });
  }
});

router.get('/monthly-trends', authenticate, authorize('Sales Executive', 'Sales Manager', 'Business Head', 'Director', 'Operations Manager', 'Finance Manager'), async (req, res) => {
  try {
    const Opportunity = (await import('../models/Opportunity.js')).default;

    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const year = Number(req.query.year) || new Date().getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

    const query = { createdAt: { $gte: startOfYear, $lte: endOfYear } };
    if (req.user.role === 'Sales Executive') {
      query.salesExecutiveId = req.user._id;
    }

    const opportunities = await Opportunity.find(query).select('createdAt tov expectedCommercialValue');

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = months.map((m) => ({ name: m, opportunities: 0, revenue: 0 }));

    opportunities.forEach((opp) => {
      const idx = new Date(opp.createdAt).getMonth();
      const revenue = Number(opp.tov || opp.expectedCommercialValue || 0) || 0;
      data[idx].opportunities += 1;
      data[idx].revenue += revenue;
    });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch monthly trends' });
  }
});

router.get('/client-health', authenticate, authorize('Sales Executive', 'Sales Manager', 'Business Head', 'Director', 'Operations Manager', 'Finance Manager'), async (req, res) => {
  try {
    const Opportunity = (await import('../models/Opportunity.js')).default;
    const Client = (await import('../models/Client.js')).default;

    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

    const clientQuery = {};
    if (req.user.role === 'Sales Executive') {
      clientQuery.createdBy = req.user._id;
    }

    const clients = await Client.find(clientQuery).select('_id');

    const clientIds = clients.map(c => c._id);
    const activeCountByClient = new Map();

    if (clientIds.length > 0) {
      const opps = await Opportunity.find({
        createdAt: { $gte: threeYearsAgo },
        $or: [
          { billingClient: { $exists: true, $ne: '' } },
          { clientCompanyName: { $exists: true, $ne: '' } }
        ],
        ...(req.user.role === 'Sales Executive' ? { salesExecutiveId: req.user._id } : {})
      }).select('billingClient clientCompanyName');

      const normalize = (s) => String(s || '').trim().toLowerCase();
      const clientNameToId = new Map();
      const fullClients = await Client.find(clientQuery).select('_id clientName');
      fullClients.forEach(c => clientNameToId.set(normalize(c.clientName), String(c._id)));

      opps.forEach(o => {
        const name = normalize(o.billingClient || o.clientCompanyName);
        const id = clientNameToId.get(name);
        if (!id) return;
        activeCountByClient.set(id, (activeCountByClient.get(id) || 0) + 1);
      });
    }

    let active = 0;
    let mid = 0;
    let inactive = 0;

    clientIds.forEach((id) => {
      const count = activeCountByClient.get(String(id)) || 0;
      if (count > 5) active += 1;
      else if (count > 1) mid += 1;
      else inactive += 1;
    });

    res.json({ active, mid, inactive });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch client health' });
  }
});

router.get('/document-tracking', authenticate, authorize('Sales Executive', 'Sales Manager', 'Business Head', 'Director', 'Operations Manager', 'Finance Manager'), async (req, res) => {
  try {
    const Opportunity = (await import('../models/Opportunity.js')).default;

    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));

    const query = {};
    if (req.user.role === 'Sales Executive') {
      query.salesExecutiveId = req.user._id;
    }

    const opportunities = await Opportunity.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('opportunityId billingClient clientCompanyName proposalDocumentUpload clientPOUpload po invoiceNumber invoiceDate invoiceDocumentUpload createdAt');

    const formatted = opportunities.map((opp) => {
      const proposalPresent = Boolean(opp.proposalDocumentUpload);
      const poPresent = Boolean(opp.clientPOUpload || opp.po);
      const invoicePresent = Boolean(opp.invoiceDocumentUpload || opp.invoiceNumber || opp.invoiceDate);
      return {
        _id: opp._id,
        opportunityId: opp.opportunityId,
        clientName: opp.billingClient || opp.clientCompanyName || 'N/A',
        proposalPresent,
        poPresent,
        invoicePresent,
        createdAt: opp.createdAt
      };
    });

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch document tracking' });
  }
});

router.get('/performance/:userId', authenticate, authorize('Sales Executive', 'Sales Manager', 'Business Head', 'Director', 'Operations Manager', 'Finance Manager'), async (req, res) => {
  try {
    const Opportunity = (await import('../models/Opportunity.js')).default;
    const User = (await import('../models/User.js')).default;

    const userId = req.params.userId;
    const timeline = String(req.query.timeline || 'Yearly');
    const year = Number(req.query.year) || new Date().getFullYear();

    if (req.user?.role === 'Sales Executive' && String(req.user._id) !== String(userId)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const targetUser = await User.findById(userId).select('targets');
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    const targets = Array.isArray(targetUser.targets) ? targetUser.targets : [];
    const targetObj = targets.find(t => Number(t.year) === Number(year) && String(t.period) === String(timeline));
    const targetAmount = targetObj ? Number(targetObj.amount) || 0 : 0;

    let startDate = new Date(year, 0, 1);
    let endDate = new Date(year, 11, 31, 23, 59, 59, 999);

    if (timeline === 'Half-Yearly') {
      const half = String(req.query.half || 'H1');
      if (half === 'H2') {
        startDate = new Date(year, 6, 1);
        endDate = new Date(year, 11, 31, 23, 59, 59, 999);
      } else {
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 5, 30, 23, 59, 59, 999);
      }
    } else if (timeline === 'Quarterly') {
      const q = Number(req.query.quarter) || 1;
      const quarterStartMonth = Math.max(0, Math.min(3 * (q - 1), 9));
      startDate = new Date(year, quarterStartMonth, 1);
      endDate = new Date(year, quarterStartMonth + 3, 0, 23, 59, 59, 999);
    }

    const query = {
      createdAt: { $gte: startDate, $lte: endDate },
      $or: [{ salesExecutiveId: userId }, { createdBy: userId }]
    };

    const opps = await Opportunity.find(query).select('tov expectedCommercialValue opportunityStatus');

    const achieved = opps
      .filter(o => o.opportunityStatus === 'Converted to Deal' || o.opportunityStatus === 'Approved')
      .reduce((sum, o) => sum + (Number(o.tov || o.expectedCommercialValue || 0) || 0), 0);

    res.json({
      userId,
      timeline,
      year,
      target: targetAmount,
      achieved
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch performance' });
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
    const Opportunity = (await import('../models/Opportunity.js')).default;

    const pendingInvoices = await Invoice.find({
      status: { $in: ['Draft', 'Generated', 'Sent'] }
    }).sort({ invoiceDate: -1 });

    const overdueReceivables = await Receivable.find({
      status: 'Overdue'
    }).populate('invoiceId');

    const totalReceivables = await Receivable.aggregate([
      { $group: { _id: null, total: { $sum: '$outstandingAmount' } } }
    ]);

    const totalPayables = await Payable.aggregate([
      { $group: { _id: null, total: { $sum: '$outstandingAmount' } } }
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
      { $group: { _id: '$tdsSection', totalTds: { $sum: '$tdsAmount' }, count: { $sum: 1 } } }
    ]);

    const nonCompliantTds = await TaxEngine.countDocuments({
      complianceStatus: { $in: ['Non-Compliant', 'Pending PAN'] }
    });

    // GP Summary from Opportunities
    const allOpportunities = await Opportunity.find({})
      .populate('salesExecutiveId', 'name email')
      .populate('salesManagerId', 'name email')
      .sort({ createdAt: -1 });

    const totalRevenue = allOpportunities.reduce((sum, o) => sum + (o.expectedCommercialValue || o.tov || 0), 0);
    const totalExpenses = allOpportunities.reduce((sum, o) => {
      const expenses = o.expenses || [];
      return sum + expenses.reduce((s, e) => s + (e.amount || 0), 0);
    }, 0);
    const grossProfit = totalRevenue - totalExpenses;
    const gpPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

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
      totalRevenue: totalRevenue || 0,
      totalExpenses: totalExpenses || 0,
      grossProfit: grossProfit || 0,
      gpPercent: gpPercent || 0,
      totalOpportunities: allOpportunities.length || 0,
      recentOpportunities: allOpportunities.slice(0, 20) || []
    });
  } catch (error) {
    console.error('Error in finance dashboard:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch dashboard data' });
  }
});

// Finance Manager - Client-wise GP Analysis
router.get('/finance/client-gp', authenticate, authorize('Finance Manager'), async (req, res) => {
  try {
    const Opportunity = (await import('../models/Opportunity.js')).default;
    const { timeline } = req.query;

    let dateFilter = {};
    const now = new Date();
    const currentYear = now.getFullYear();

    if (timeline && timeline.startsWith('month-')) {
      const month = parseInt(timeline.split('-')[1]);
      dateFilter = {
        createdAt: {
          $gte: new Date(currentYear, month, 1),
          $lt: new Date(currentYear, month + 1, 1)
        }
      };
    } else if (timeline && timeline.startsWith('quarter-')) {
      const quarter = timeline.split('-')[1];
      const quarterMonths = { Q1: [3, 5], Q2: [6, 8], Q3: [9, 11], Q4: [0, 2] };
      const [startMonth, endMonth] = quarterMonths[quarter] || [0, 11];
      const year = quarter === 'Q4' ? currentYear : currentYear;
      dateFilter = {
        createdAt: {
          $gte: new Date(year, startMonth, 1),
          $lt: new Date(year, endMonth + 1, 1)
        }
      };
    } else {
      // Default: current fiscal year
      const fiscalStart = now.getMonth() >= 3 ? new Date(currentYear, 3, 1) : new Date(currentYear - 1, 3, 1);
      dateFilter = { createdAt: { $gte: fiscalStart } };
    }

    const opportunities = await Opportunity.find(dateFilter).lean();

    // Group by client
    const clientMap = {};
    opportunities.forEach(opp => {
      const clientName = opp.billingClient || opp.clientCompanyName || 'Unknown';
      if (!clientMap[clientName]) {
        clientMap[clientName] = { clientName, totalRevenue: 0, totalExpenses: 0, gp: 0, gpPercent: 0, count: 0 };
      }
      const revenue = opp.expectedCommercialValue || opp.tov || 0;
      const expenses = (opp.expenses || []).reduce((s, e) => s + (e.amount || 0), 0);
      clientMap[clientName].totalRevenue += revenue;
      clientMap[clientName].totalExpenses += expenses;
      clientMap[clientName].count += 1;
    });

    const clientData = Object.values(clientMap).map(c => ({
      ...c,
      gp: c.totalRevenue - c.totalExpenses,
      gpPercent: c.totalRevenue > 0 ? ((c.totalRevenue - c.totalExpenses) / c.totalRevenue) * 100 : 0
    })).sort((a, b) => b.totalRevenue - a.totalRevenue);

    res.json({ clientData });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch client GP data' });
  }
});

// Finance Manager - Vendor-wise Expense Analysis
router.get('/finance/vendor-expenses', authenticate, authorize('Finance Manager'), async (req, res) => {
  try {
    const Opportunity = (await import('../models/Opportunity.js')).default;
    const { timeline } = req.query;

    let dateFilter = {};
    const now = new Date();
    const currentYear = now.getFullYear();

    if (timeline && timeline.startsWith('month-')) {
      const month = parseInt(timeline.split('-')[1]);
      dateFilter = {
        createdAt: {
          $gte: new Date(currentYear, month, 1),
          $lt: new Date(currentYear, month + 1, 1)
        }
      };
    } else if (timeline && timeline.startsWith('quarter-')) {
      const quarter = timeline.split('-')[1];
      const quarterMonths = { Q1: [3, 5], Q2: [6, 8], Q3: [9, 11], Q4: [0, 2] };
      const [startMonth, endMonth] = quarterMonths[quarter] || [0, 11];
      dateFilter = {
        createdAt: {
          $gte: new Date(currentYear, startMonth, 1),
          $lt: new Date(currentYear, endMonth + 1, 1)
        }
      };
    } else {
      const fiscalStart = now.getMonth() >= 3 ? new Date(currentYear, 3, 1) : new Date(currentYear - 1, 3, 1);
      dateFilter = { createdAt: { $gte: fiscalStart } };
    }

    const opportunities = await Opportunity.find(dateFilter).lean();

    // Group expenses by vendor
    const vendorMap = {};
    opportunities.forEach(opp => {
      const expenses = opp.expenses || [];
      expenses.forEach(exp => {
        const vendorName = exp.vendorName || exp.description || 'Unknown';
        if (!vendorMap[vendorName]) {
          vendorMap[vendorName] = { vendorName, totalExpense: 0, opportunityCount: 0 };
        }
        vendorMap[vendorName].totalExpense += exp.amount || 0;
        vendorMap[vendorName].opportunityCount += 1;
      });
    });

    const vendorData = Object.values(vendorMap).sort((a, b) => b.totalExpense - a.totalExpense);

    res.json({ vendorData });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch vendor expense data' });
  }
});

router.get('/director', authenticate, authorize('Director'), async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const Opportunity = (await import('../models/Opportunity.js')).default;
    const Client = (await import('../models/Client.js')).default;
    const User = (await import('../models/User.js')).default;

    const totalReceivables = await Receivable.aggregate([
      { $group: { _id: null, total: { $sum: '$outstandingAmount' } } }
    ]);

    const totalPayables = await Payable.aggregate([
      { $group: { _id: null, total: { $sum: '$outstandingAmount' } } }
    ]);

    const revenue = await Invoice.aggregate([
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const expenses = await Payable.aggregate([
      { $group: { _id: null, total: { $sum: '$paidAmount' } } }
    ]);

    // Company-wide stats
    const totalClients = await Client.countDocuments({});
    const allOpportunities = await Opportunity.find({})
      .populate('salesExecutiveId', 'name email')
      .populate('salesManagerId', 'name email')
      .sort({ createdAt: -1 });

    const totalOpportunities = allOpportunities.length;
    const wonOpportunities = allOpportunities.filter(o => o.opportunityStatus === 'Converted to Deal').length;
    const activeOpportunities = allOpportunities.filter(o => !['Lost', 'Dropped', 'Converted to Deal'].includes(o.opportunityStatus)).length;

    // Monthly performance data (last 6 months)
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthName = monthStart.toLocaleString('default', { month: 'short' });

      const monthOpps = allOpportunities.filter(o => {
        const created = new Date(o.createdAt);
        return created >= monthStart && created <= monthEnd;
      });

      const monthRevenue = monthOpps.reduce((sum, o) => sum + (o.expectedCommercialValue || o.tov || 0), 0);
      const monthWon = monthOpps.filter(o => o.opportunityStatus === 'Converted to Deal').length;

      monthlyData.push({ name: monthName, revenue: monthRevenue, opportunities: monthOpps.length, won: monthWon });
    }

    // Team performance summary
    const teamPerformance = await User.aggregate([
      { $match: { role: { $in: ['Sales Executive', 'Sales Manager'] } } },
      { $lookup: { from: 'opportunities', localField: '_id', foreignField: 'salesExecutiveId', as: 'opportunities' } },
      { $project: {
        name: 1, role: 1,
        totalOpportunities: { $size: '$opportunities' },
        totalValue: { $sum: '$opportunities.expectedCommercialValue' }
      }},
      { $sort: { totalValue: -1 } },
      { $limit: 10 }
    ]);

    const riskAlerts = await Governance.find({
      $or: [
        { lossMakingProjectFlag: true },
        { fraudAlertType: { $ne: 'None' } }
      ]
    }).populate('dealId programId').limit(10);

    const profitLoss = (revenue[0]?.total || 0) - (expenses[0]?.total || 0);
    const profitMargin = revenue[0]?.total > 0 ? (profitLoss / revenue[0].total) * 100 : 0;

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
      profitMargin: profitMargin || 0,
      totalClients: totalClients || 0,
      totalOpportunities: totalOpportunities || 0,
      wonOpportunities: wonOpportunities || 0,
      activeOpportunities: activeOpportunities || 0,
      monthlyData: monthlyData || [],
      teamPerformance: teamPerformance || [],
      riskAlerts: riskAlerts || [],
      revenueTargets: revenueTargets || [],
      recentOpportunities: allOpportunities.slice(0, 20) || [],
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
    const closures = myOpportunities.filter(o => o.opportunityStatus === 'Converted to Deal' || o.opportunityStatus === 'Approved').length;

    const pipeline = {
      new: myOpportunities.filter(o => o.opportunityStatus === 'New').length,
      qualified: myOpportunities.filter(o => o.opportunityStatus === 'Qualified').length,
      sentToDelivery: myOpportunities.filter(o => o.opportunityStatus === 'Sent to Delivery').length,
      converted: closures,
      lost: myOpportunities.filter(o => o.opportunityStatus === 'Lost').length
    };

    const totalValue = myOpportunities.reduce((sum, o) => sum + (o.expectedCommercialValue || o.tov || 0), 0);
    const convertedValue = myOpportunities
      .filter(o => o.opportunityStatus === 'Converted to Deal' || o.opportunityStatus === 'Approved')
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
    const Client = (await import('../models/Client.js')).default;
    const User = (await import('../models/User.js')).default;

    // Get team members (Sales Executives)
    const teamMembers = await User.find({ role: 'Sales Executive' }).select('name email');
    const teamMembersCount = teamMembers.length;

    // Sales Manager sees all opportunities
    const allOpportunities = await Opportunity.find({})
      .populate('salesExecutiveId', 'name email')
      .populate('salesManagerId', 'name email')
      .sort({ createdAt: -1 });

    // Get total clients
    const totalClients = await Client.countDocuments({});

    const pipeline = {
      new: allOpportunities.filter(o => o.opportunityStatus === 'New').length,
      qualified: allOpportunities.filter(o => o.opportunityStatus === 'Qualified').length,
      sentToDelivery: allOpportunities.filter(o => o.opportunityStatus === 'Sent to Delivery').length,
      converted: allOpportunities.filter(o => o.opportunityStatus === 'Converted to Deal').length,
      lost: allOpportunities.filter(o => o.opportunityStatus === 'Lost').length
    };

    const inProgressOpportunities = allOpportunities.filter(o => 
      !['Converted to Deal', 'Lost', 'Dropped'].includes(o.opportunityStatus)
    ).length;
    const completedOpportunities = allOpportunities.filter(o => 
      o.opportunityStatus === 'Converted to Deal'
    ).length;

    // Document stats
    const poCount = allOpportunities.filter(o => o.clientPOUpload).length;
    const invoiceCount = allOpportunities.filter(o => o.invoiceDocumentUpload).length;

    const totalValue = allOpportunities.reduce((sum, o) => sum + (o.expectedCommercialValue || o.tov || 0), 0);
    const convertedValue = allOpportunities
      .filter(o => o.opportunityStatus === 'Converted to Deal')
      .reduce((sum, o) => sum + (o.expectedCommercialValue || o.tov || 0), 0);

    const pendingQualification = allOpportunities.filter(o => o.opportunityStatus === 'New');

    // Get current revenue target
    const currentYear = new Date().getFullYear();
    const targets = await RevenueTarget.find({ year: currentYear });
    const latestTarget = targets.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
    const revenueTarget = latestTarget ? latestTarget.amount : 0;

    res.json({
      revenueTarget: revenueTarget || 0,
      totalClients: totalClients || 0,
      teamMembersCount: teamMembersCount || 0,
      inProgressOpportunities: inProgressOpportunities || 0,
      completedOpportunities: completedOpportunities || 0,
      poCount: poCount || 0,
      invoiceCount: invoiceCount || 0,
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

// Sales Manager - Get Team Members
router.get('/sales-manager/team-members', authenticate, authorize('Sales Manager'), async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    const teamMembers = await User.find({ role: 'Sales Executive' })
      .select('name email targets')
      .lean();
    res.json(teamMembers || []);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch team members' });
  }
});

// Sales Manager - Monthly Performance
router.get('/sales-manager/monthly-performance', authenticate, authorize('Sales Manager'), async (req, res) => {
  try {
    const Opportunity = (await import('../models/Opportunity.js')).default;
    const { userId } = req.query;
    const year = Number(req.query.year) || new Date().getFullYear();

    const query = {};
    if (userId && userId !== 'all') {
      query.salesExecutiveId = userId;
    }

    const opportunities = await Opportunity.find(query)
      .select('opportunityStatus expectedCommercialValue tov createdAt trainingMonth trainingYear')
      .lean();

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthMap = {
      'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
      'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
    };

    const performance = months.map((name, idx) => ({
      name,
      inProgress: 0,
      completed: 0,
      revenue: 0
    }));

    opportunities.forEach(opp => {
      let monthIdx = -1;
      if (opp.trainingMonth && opp.trainingYear === year) {
        monthIdx = monthMap[opp.trainingMonth] ?? -1;
      } else if (opp.createdAt) {
        const d = new Date(opp.createdAt);
        if (d.getFullYear() === year) monthIdx = d.getMonth();
      }
      if (monthIdx < 0 || monthIdx > 11) return;

      const value = Number(opp.expectedCommercialValue || opp.tov || 0);
      if (opp.opportunityStatus === 'Converted to Deal') {
        performance[monthIdx].completed += 1;
        performance[monthIdx].revenue += value;
      } else if (!['Lost', 'Dropped'].includes(opp.opportunityStatus)) {
        performance[monthIdx].inProgress += 1;
      }
    });

    res.json(performance);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch monthly performance' });
  }
});

// Sales Manager - Set Target for Team Member
router.put('/sales-manager/set-target/:memberId', authenticate, authorize('Sales Manager'), async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    const { memberId } = req.params;
    const { period, year, amount } = req.body;

    if (!period || !year || amount === undefined) {
      return res.status(400).json({ error: 'period, year, and amount are required' });
    }

    const user = await User.findById(memberId);
    if (!user) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    // Initialize targets array if not exists
    if (!user.targets) user.targets = [];

    // Find existing target for this period/year or create new
    const existingIdx = user.targets.findIndex(t => t.year === Number(year) && t.period === period);
    if (existingIdx >= 0) {
      user.targets[existingIdx].amount = Number(amount);
    } else {
      user.targets.push({ period, year: Number(year), amount: Number(amount) });
    }

    await user.save();
    res.json({ message: 'Target updated successfully', targets: user.targets });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to set target' });
  }
});


export default router;
