import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import Opportunity from '../models/Opportunity.js';
import ExcelJS from 'exceljs';

const router = express.Router();

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const monthIndexToName = (idx) => MONTHS[idx] || null;

const getMonthNameFromDate = (d) => {
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return 'N/A';
  return monthIndexToName(dt.getMonth()) || 'N/A';
};

const getYearFromDate = (d) => {
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.getFullYear();
};

const buildDateRange = ({ type, yearInt, monthInt, quarter }) => {
  // Fiscal year mapping (Apr-Mar)
  // Q1: Apr-Jun, Q2: Jul-Sep, Q3: Oct-Dec, Q4: Jan-Mar (next calendar year)
  if (type === 'quarter') {
    const q = String(quarter || '').toUpperCase();
    const map = {
      Q1: { start: new Date(yearInt, 3, 1), end: new Date(yearInt, 6, 1) },
      Q2: { start: new Date(yearInt, 6, 1), end: new Date(yearInt, 9, 1) },
      Q3: { start: new Date(yearInt, 9, 1), end: new Date(yearInt, 12, 1) },
      Q4: { start: new Date(yearInt + 1, 0, 1), end: new Date(yearInt + 1, 3, 1) }
    };
    if (!map[q]) throw new Error('Invalid quarter');
    return map[q];
  }

  if (type === 'fiscal_year') {
    // Example: fiscal year 2026 => Apr 2026 ... Mar 2027
    return { start: new Date(yearInt, 3, 1), end: new Date(yearInt + 1, 3, 1) };
  }

  // month (calendar month)
  if (!Number.isFinite(monthInt) || monthInt < 1 || monthInt > 12) {
    throw new Error('month is required for month type (1-12)');
  }
  const start = new Date(yearInt, monthInt - 1, 1);
  const end = new Date(yearInt, monthInt, 1);
  return { start, end };
};

const buildGpReport = async ({ user, type, yearInt, monthInt, quarter }) => {
  const { start, end } = buildDateRange({ type, yearInt, monthInt, quarter });

  const createdAtFilter = {
    createdAt: {
      $gte: start,
      $lt: end
    }
  };

  // Fallback filter for data sets where trainingMonth/trainingYear is maintained
  // but createdAt may not match the training period.
  let trainingFilter = null;
  if (type === 'quarter') {
    const qMap = {
      Q1: ['April', 'May', 'June'],
      Q2: ['July', 'August', 'September'],
      Q3: ['October', 'November', 'December'],
      Q4: ['January', 'February', 'March']
    };
    const months = qMap[String(quarter || '').toUpperCase()];
    if (months) {
      trainingFilter = {
        trainingMonth: { $in: months },
        trainingYear: String(quarter || '').toUpperCase() === 'Q4' ? yearInt + 1 : yearInt
      };
    }
  } else if (type === 'fiscal_year') {
    trainingFilter = {
      $or: [
        { trainingMonth: { $in: ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] }, trainingYear: yearInt },
        { trainingMonth: { $in: ['January', 'February', 'March'] }, trainingYear: yearInt + 1 }
      ]
    };
  } else {
    // month
    const name = monthIndexToName(monthInt - 1);
    if (name) {
      trainingFilter = { trainingMonth: name, trainingYear: yearInt };
    }
  }

  const query = trainingFilter
    ? { $or: [createdAtFilter, trainingFilter] }
    : createdAtFilter;

  if (user.role === 'Sales Executive') {
    query.$and = query.$and || [];
    query.$and.push({
      $or: [
        { salesExecutiveId: user._id },
        { createdBy: user._id }
      ]
    });
  }

  const opportunities = await Opportunity.find(query)
    .populate('createdBy', 'name email')
    .populate('salesExecutiveId', 'name email')
    .select('billingClient clientCompanyName trainingMonth trainingYear createdAt createdBy salesExecutiveId tov expectedCommercialValue trainerPOValues labPOValue courseMaterial royaltyCharges travelCharges accommodation perDiem localConveyance marketingChargesAmount contingencyAmount');

  const groupMap = new Map();

  opportunities.forEach((opp) => {
    const clientName = String(opp.billingClient || opp.clientCompanyName || 'Unknown Client').trim() || 'Unknown Client';
    const effectiveMonth = String(opp.trainingMonth || '').trim() || getMonthNameFromDate(opp.createdAt);
    const effectiveYear = Number.isFinite(Number(opp.trainingYear)) ? Number(opp.trainingYear) : getYearFromDate(opp.createdAt);
    const salesPerson = String(opp.createdBy?.name || opp.salesExecutiveId?.name || '').trim() || 'N/A';

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

    const key = `${clientName}__${salesPerson}__${effectiveMonth || 'N/A'}__${Number.isFinite(effectiveYear) ? effectiveYear : 'N/A'}`;
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        clientName,
        salesPerson,
        trainingMonth: effectiveMonth || 'N/A',
        trainingYear: Number.isFinite(effectiveYear) ? effectiveYear : null,
        totalRevenue: 0,
        totalExpenses: 0,
        opportunityCount: 0
      });
    }

    const entry = groupMap.get(key);
    entry.totalRevenue += revenue;
    entry.totalExpenses += expenses;
    entry.opportunityCount += 1;
  });

  const clientData = Array.from(groupMap.values()).map((c, index) => {
    const gp = c.totalRevenue - c.totalExpenses;
    const gpPercent = c.totalRevenue > 0 ? (gp / c.totalRevenue) * 100 : 0;
    return {
      sno: index + 1,
      clientName: c.clientName,
      salesPerson: c.salesPerson,
      trainingMonth: c.trainingMonth,
      trainingYear: c.trainingYear,
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

  return { summary, clientData, opportunities };
};
router.get('/gp-analysis', authenticate, authorize('Sales Executive', 'Sales Manager', 'Finance Manager', 'Director', 'Business Head', 'Operations Manager'), async (req, res) => {
  try {
    const { type = 'month' } = req.query;
    const yearInt = Number(req.query.year);
    const monthInt = Number(req.query.month);
    const quarter = String(req.query.quarter || '').toUpperCase();

    if (!Number.isFinite(yearInt)) {
      return res.status(400).json({ error: 'year is required and must be a number' });
    }

    const { summary, clientData } = await buildGpReport({
      user: req.user,
      type,
      yearInt,
      monthInt,
      quarter
    });

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
    if (String(error.message || '').includes('month is required') || String(error.message || '').includes('Invalid quarter')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

router.get('/gp-analysis/export', authenticate, authorize('Sales Executive', 'Sales Manager', 'Finance Manager', 'Director', 'Business Head', 'Operations Manager'), async (req, res) => {
  try {
    const { type = 'month', format = 'xlsx' } = req.query;
    const yearInt = Number(req.query.year);
    const monthInt = Number(req.query.month);
    const quarter = String(req.query.quarter || '').toUpperCase();

    if (!Number.isFinite(yearInt)) {
      return res.status(400).json({ error: 'year is required and must be a number' });
    }

    const { clientData } = await buildGpReport({
      user: req.user,
      type,
      yearInt,
      monthInt,
      quarter
    });

    const safeType = String(type || 'month').replace(/[^a-z0-9_\-]/gi, '_');
    const fileBase = `gp_report_${safeType}_${yearInt}`;

    if (String(format).toLowerCase() === 'csv') {
      const header = ['S.No', 'Client Name', 'Period', 'Sales Person', 'Total Revenue', 'Total Expenses', 'Gross Profit', 'GP %', 'Opportunities'];
      const rows = clientData.map((c) => [
        c.sno,
        c.clientName,
        `${c.trainingMonth || 'N/A'}/${c.trainingYear || 'N/A'}`,
        c.salesPerson || '',
        c.totalRevenue || 0,
        c.totalExpenses || 0,
        c.gp || 0,
        Number(c.gpPercent || 0).toFixed(2),
        c.opportunityCount || 0
      ]);

      const csv = [header, ...rows]
        .map((r) => r.map((cell) => {
          const s = String(cell ?? '');
          if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
          return s;
        }).join(','))
        .join('\n');

      res.setHeader('Content-Type', 'text/csv;charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${fileBase}.csv"`);
      return res.send(csv);
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('GP Report');

    sheet.columns = [
      { header: 'S.No', key: 'sno', width: 8 },
      { header: 'Client Name', key: 'clientName', width: 28 },
      { header: 'Period', key: 'period', width: 14 },
      { header: 'Sales Person', key: 'salesPerson', width: 22 },
      { header: 'Total Revenue', key: 'totalRevenue', width: 16 },
      { header: 'Total Expenses', key: 'totalExpenses', width: 16 },
      { header: 'Gross Profit', key: 'gp', width: 16 },
      { header: 'GP %', key: 'gpPercent', width: 10 },
      { header: 'Opportunities', key: 'opportunityCount', width: 14 }
    ];

    clientData.forEach((c) => {
      sheet.addRow({
        sno: c.sno,
        clientName: c.clientName,
        period: `${c.trainingMonth || 'N/A'}/${c.trainingYear || 'N/A'}`,
        salesPerson: c.salesPerson || '',
        totalRevenue: c.totalRevenue || 0,
        totalExpenses: c.totalExpenses || 0,
        gp: c.gp || 0,
        gpPercent: Number(c.gpPercent || 0),
        opportunityCount: c.opportunityCount || 0
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileBase}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('GP Export Error:', error);
    if (String(error.message || '').includes('month is required') || String(error.message || '').includes('Invalid quarter')) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: error.message || 'Server error' });
  }
});

export default router;
