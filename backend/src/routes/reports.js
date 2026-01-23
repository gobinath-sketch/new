import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import Opportunity from '../models/Opportunity.js';

const router = express.Router();

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const monthIndexToName = (idx) => MONTHS[idx] || null;
router.get('/gp-analysis', authenticate, authorize('Sales Executive', 'Sales Manager', 'Finance Manager', 'Director', 'Business Head', 'Operations Manager'), async (req, res) => {
  try {
    const { type = 'month' } = req.query;
    const yearInt = Number(req.query.year);
    const monthInt = Number(req.query.month);
    const quarter = String(req.query.quarter || '').toUpperCase();

    if (!Number.isFinite(yearInt)) {
      return res.status(400).json({ error: 'year is required and must be a number' });
    }

    const query = {};

    if (type === 'quarter') {
      const qMap = {
        Q1: ['April', 'May', 'June'],
        Q2: ['July', 'August', 'September'],
        Q3: ['October', 'November', 'December'],
        Q4: ['January', 'February', 'March']
      };
      if (!qMap[quarter]) return res.status(400).json({ error: 'Invalid quarter' });

      query.trainingMonth = { $in: qMap[quarter] };
      // Q4 is Jan-Mar of next calendar year
      query.trainingYear = quarter === 'Q4' ? yearInt + 1 : yearInt;
    } else if (type === 'fiscal_year') {
      query.$or = [
        { trainingMonth: { $in: ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] }, trainingYear: yearInt },
        { trainingMonth: { $in: ['January', 'February', 'March'] }, trainingYear: yearInt + 1 }
      ];
    } else {
      // month
      if (!Number.isFinite(monthInt) || monthInt < 1 || monthInt > 12) {
        return res.status(400).json({ error: 'month is required for month type (1-12)' });
      }
      query.trainingMonth = monthIndexToName(monthInt - 1);
      query.trainingYear = yearInt;
    }

    // Role-based scoping
    if (req.user.role === 'Sales Executive') {
      query.$or = [
        { salesExecutiveId: req.user._id },
        { createdBy: req.user._id }
      ];
    }

    // For Sales Manager, show all for now (team hierarchy not in current schema).

    const opportunities = await Opportunity.find(query).select('billingClient clientCompanyName tov trainerPOValues labPOValue courseMaterial royaltyCharges travelCharges accommodation perDiem localConveyance marketingChargesAmount contingencyAmount finalGP gpPercent');

    const clientMap = new Map();

    opportunities.forEach((opp) => {
      const clientName = String(opp.billingClient || opp.clientCompanyName || 'Unknown Client').trim() || 'Unknown Client';

      const revenue = Number(opp.tov || opp.expectedCommercialValue || 0) || 0;
      const expenses =
        (Number(opp.trainerPOValues) || 0) +
        (Number(opp.labPOValue) || 0) +
        (Number(opp.courseMaterial) || 0) +
        (Number(opp.royaltyCharges) || 0) +
        (Number(opp.travelCharges) || 0) +
        (Number(opp.accommodation) || 0) +
        (Number(opp.perDiem) || 0) +
        (Number(opp.localConveyance) || 0) +
        (Number(opp.marketingChargesAmount) || 0) +
        (Number(opp.contingencyAmount) || 0);

      const key = clientName;
      if (!clientMap.has(key)) {
        clientMap.set(key, { clientName, totalRevenue: 0, totalExpenses: 0, opportunityCount: 0 });
      }
      const entry = clientMap.get(key);
      entry.totalRevenue += revenue;
      entry.totalExpenses += expenses;
      entry.opportunityCount += 1;
    });

    const clientData = Array.from(clientMap.values()).map((c, index) => {
      const gp = c.totalRevenue - c.totalExpenses;
      const gpPercent = c.totalRevenue > 0 ? (gp / c.totalRevenue) * 100 : 0;
      return {
        sno: index + 1,
        clientName: c.clientName,
        totalRevenue: c.totalRevenue,
        totalExpenses: c.totalExpenses,
        gp,
        gpPercent,
        opportunityCount: c.opportunityCount
      };
    });

    const summary = {
      totalRevenue: clientData.reduce((s, c) => s + c.totalRevenue, 0),
      totalExpenses: clientData.reduce((s, c) => s + c.totalExpenses, 0),
      totalOpportunities: opportunities.length,
      totalClients: clientData.length
    };
    summary.grossProfit = summary.totalRevenue - summary.totalExpenses;
    summary.gpPercent = summary.totalRevenue > 0 ? (summary.grossProfit / summary.totalRevenue) * 100 : 0;

    res.json({
      type,
      month: Number.isFinite(monthInt) ? monthInt : null,
      quarter: quarter || null,
      year: yearInt,
      summary,
      clientData
    });
  } catch (error) {
    console.error('GP Analysis Error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

export default router;
