import { useState, useEffect } from 'react';
import api from '../services/api';
import './Table.css';

const GP = ({ user }) => {
    const [loading, setLoading] = useState(true);
    const [opportunities, setOpportunities] = useState([]);
    const [gpData, setGpData] = useState([]);
    const [includeTax, setIncludeTax] = useState(false); // Default to without tax

    useEffect(() => {
        fetchData();
    }, [includeTax]); // Re-calculate when tax toggle changes

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Opportunities to get the "Master List" of active Adhoc IDs
            // In a real app, you might fetching these in parallel
            const oppsRes = await api.get('/opportunities'); // Assuming this exists
            const opps = oppsRes.data || [];

            // 2. Fetch Receivables (Client Invoices) for TOV
            const invoicesRes = await api.get('/receivables'); // Assuming endpoint
            const invoices = invoicesRes.data || [];

            // 3. Fetch Payables (Vendor Expenses) for Total Expense
            const payablesRes = await api.get('/payables'); // Assuming endpoint
            const payables = payablesRes.data || [];

            // --- Aggregation Logic ---

            // Helper to get amount based on tax toggle
            const getAmount = (item) => {
                // Assuming item has 'taxableAmount' and 'netAmount' (or totalAmount)
                // Adjust these field names based on actual API/Form structure
                if (includeTax) {
                    return parseFloat(item.totalAmount || item.netAmount || 0);
                }
                return parseFloat(item.taxableAmount || item.amount || 0);
            };

            // Map Opportunities to the final structure
            const processedData = opps.map(opp => {
                const adhocId = opp.adhocId;

                // A. Calculate TOV from Receivables matching Adhoc ID
                const matchedInvoices = invoices.filter(inv => inv.adhocId === adhocId);
                const tov = matchedInvoices.reduce((sum, inv) => sum + getAmount(inv), 0);

                // B. Calculate Total Expense from Payables matching Adhoc ID
                const matchedPayables = payables.filter(pay => pay.adhocId === adhocId);
                const totalExpense = matchedPayables.reduce((sum, pay) => sum + getAmount(pay), 0);

                // C. Calculate Profit & GP
                const profit = tov - totalExpense;
                const gpPercent = tov > 0 ? (profit / tov) * 100 : 0;

                return {
                    id: opp.id,
                    adhocId: adhocId,
                    clientName: opp.clientCompanyName || opp.billingClient || opp.clientName || 'N/A',
                    salesName: opp.salesExecutiveId?.name || opp.salesManagerId?.name || opp.sales || opp.salesOwner || 'N/A',
                    month: opp.trainingMonth || opp.month || '-',
                    year: opp.trainingYear || opp.year || '-',
                    tov: tov,
                    totalExpense: totalExpense,
                    profit: profit,
                    gpPercent: gpPercent,
                    oppTov: opp.tov,
                    breakdown: {
                        invoices: matchedInvoices,
                        payables: matchedPayables
                    }
                };
            });

            setGpData(processedData);
            setOpportunities(opps);
        } catch (error) {
            console.error("Error fetching GP data:", error);
            setGpData([]);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(val);
    };

    const formatPercent = (val) => {
        return val.toFixed(2) + '%';
    };

    const [selectedOpp, setSelectedOpp] = useState(null);

    const DetailModal = () => {
        if (!selectedOpp) return null;

        const { invoices, payables } = selectedOpp.breakdown;

        return (
            <div className="modal-overlay" style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
                zIndex: 1000
            }}>
                <div style={{
                    background: 'white', padding: '24px', borderRadius: '8px',
                    width: '90%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                        <div>
                            <h2 style={{ fontSize: '20px', margin: 0, color: '#111827' }}>Financial Breakdown</h2>
                            <p style={{ margin: '4px 0 0', color: '#6b7280' }}>Adhoc ID: <strong>{selectedOpp.adhocId}</strong></p>
                        </div>
                        <button onClick={() => setSelectedOpp(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280' }}>&times;</button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                        {/* Receivables Section */}
                        <div>
                            <h3 style={{ fontSize: '16px', color: '#4f46e5', marginBottom: '12px' }}>TOV (Client Receivables)</h3>
                            <div style={{ background: '#f9fafb', padding: '12px', borderRadius: '6px' }}>
                                <table style={{ width: '100%', fontSize: '13px' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left', color: '#6b7280' }}>
                                            <th style={{ paddingBottom: '8px' }}>Invoice No</th>
                                            <th style={{ paddingBottom: '8px', textAlign: 'right' }}>Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoices.length === 0 ? (
                                            <tr><td colSpan="2" style={{ padding: '8px 0', textAlign: 'center', color: '#9ca3af' }}>No records found</td></tr>
                                        ) : (
                                            invoices.map((inv, idx) => (
                                                <tr key={idx} style={{ borderTop: '1px solid #e5e7eb' }}>
                                                    <td style={{ padding: '8px 0' }}>{inv.invoiceNumber || 'N/A'}</td>
                                                    <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '500' }}>
                                                        {formatCurrency(includeTax ? (inv.totalAmount || inv.invoiceAmount) : (inv.taxableAmount || 0))}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                        <tr style={{ borderTop: '2px solid #e5e7eb', fontWeight: 'bold' }}>
                                            <td style={{ paddingTop: '12px' }}>Total TOV</td>
                                            <td style={{ paddingTop: '12px', textAlign: 'right', color: '#4f46e5' }}>{formatCurrency(selectedOpp.tov)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Payables Section */}
                        <div>
                            <h3 style={{ fontSize: '16px', color: '#dc2626', marginBottom: '12px' }}>Total Expense (Vendor Payables)</h3>
                            <div style={{ background: '#f9fafb', padding: '12px', borderRadius: '6px' }}>
                                <table style={{ width: '100%', fontSize: '13px' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left', color: '#6b7280' }}>
                                            <th style={{ paddingBottom: '8px' }}>Expense Type</th>
                                            <th style={{ paddingBottom: '8px', textAlign: 'right' }}>Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payables.length === 0 ? (
                                            <tr><td colSpan="2" style={{ padding: '8px 0', textAlign: 'center', color: '#9ca3af' }}>No records found</td></tr>
                                        ) : (
                                            payables.map((pay, idx) => (
                                                <tr key={idx} style={{ borderTop: '1px solid #e5e7eb' }}>
                                                    <td style={{ padding: '8px 0' }}>{pay.expenseType || pay.vendorName || 'N/A'}</td>
                                                    <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '500' }}>
                                                        {formatCurrency(includeTax ? (pay.totalAmount || pay.amount || 0) : (pay.taxableAmount || pay.amount || 0))}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                        <tr style={{ borderTop: '2px solid #e5e7eb', fontWeight: 'bold' }}>
                                            <td style={{ paddingTop: '12px' }}>Total Expense</td>
                                            <td style={{ paddingTop: '12px', textAlign: 'right', color: '#dc2626' }}>{formatCurrency(selectedOpp.totalExpense)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <span style={{ display: 'block', fontSize: '14px', color: '#166534' }}>Net Profit</span>
                            <strong style={{ fontSize: '24px', color: '#166534' }}>{formatCurrency(selectedOpp.profit)}</strong>
                        </div>
                        <div>
                            <span style={{ display: 'block', fontSize: '14px', color: '#166534', textAlign: 'right' }}>GP Percentage</span>
                            <strong style={{ fontSize: '24px', color: '#166534' }}>{formatPercent(selectedOpp.gpPercent)}</strong>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="gp-dashboard">
            <div className="page-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">GP Analysis</h1>
                    <p style={{ color: '#6b7280', marginTop: '4px' }}>Real-time Gross Profit tracking per Opportunity</p>
                </div>

                {/* Tax Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', background: 'white', padding: '8px 16px', borderRadius: '30px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: includeTax ? '#6b7280' : '#111827', marginRight: '10px' }}>Without Tax</span>
                    <div
                        onClick={() => setIncludeTax(!includeTax)}
                        style={{
                            width: '48px',
                            height: '24px',
                            borderRadius: '12px',
                            background: includeTax ? '#4f46e5' : '#e5e7eb',
                            position: 'relative',
                            cursor: 'pointer',
                            transition: 'background 0.3s'
                        }}
                    >
                        <div style={{
                            position: 'absolute',
                            top: '2px',
                            left: includeTax ? '26px' : '2px',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: 'white',
                            transition: 'left 0.3s',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                        }} />
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: includeTax ? '#111827' : '#6b7280', marginLeft: '10px' }}>With Tax</span>
                </div>
            </div>

            <div className="table-container" style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Adhoc ID</th>
                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Client Name</th>
                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Sales Name</th>
                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Month</th>
                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Year</th>
                            <th style={{ padding: '16px', textAlign: 'right', fontWeight: '600', color: '#4f46e5' }}>TOV (Receivables)</th>
                            <th style={{ padding: '16px', textAlign: 'right', fontWeight: '600', color: '#dc2626' }}>Total Expense</th>
                            <th style={{ padding: '16px', textAlign: 'right', fontWeight: '600', color: '#059669' }}>Profit</th>
                            <th style={{ padding: '16px', textAlign: 'right', fontWeight: '600', color: '#059669' }}>GP %</th>
                            <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="10" style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Loading GP data...</td>
                            </tr>
                        ) : gpData.length === 0 ? (
                            <tr>
                                <td colSpan="10" style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>No active opportunities or financial data found.</td>
                            </tr>
                        ) : (
                            gpData.map((row) => (
                                <tr key={row.adhocId} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                    <td style={{ padding: '16px', fontWeight: '500' }}>{row.adhocId || '-'}</td>
                                    <td style={{ padding: '16px' }}>{row.clientName || '-'}</td>
                                    <td style={{ padding: '16px' }}>{row.salesName || '-'}</td>
                                    <td style={{ padding: '16px' }}>{row.month || '-'}</td>
                                    <td style={{ padding: '16px' }}>{row.year || '-'}</td>
                                    <td style={{ padding: '16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: '600', color: '#4f46e5' }}>
                                        {formatCurrency(row.tov)}
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: '600', color: '#dc2626' }}>
                                        {formatCurrency(row.totalExpense)}
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: '600', color: row.profit >= 0 ? '#059669' : '#dc2626' }}>
                                        {formatCurrency(row.profit)}
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'right', fontWeight: '700', color: row.gpPercent >= 0 ? '#059669' : '#dc2626' }}>
                                        {formatPercent(row.gpPercent)}
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'center' }}>
                                        <button
                                            onClick={() => setSelectedOpp(row)}
                                            style={{
                                                padding: '6px 12px',
                                                background: '#f3f4f6',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '13px',
                                                color: '#374151',
                                                fontWeight: '500'
                                            }}
                                        >
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}

                        {/* Totals Row */}
                        {!loading && gpData.length > 0 && (
                            <tr style={{ background: '#f0fdf4', fontWeight: 'bold' }}>
                                <td colSpan="5" style={{ padding: '16px', textAlign: 'right', textTransform: 'uppercase', fontSize: '13px', letterSpacing: '0.05em' }}>Grand Total</td>
                                <td style={{ padding: '16px', textAlign: 'right', color: '#4f46e5' }}>
                                    {formatCurrency(gpData.reduce((sum, item) => sum + item.tov, 0))}
                                </td>
                                <td style={{ padding: '16px', textAlign: 'right', color: '#dc2626' }}>
                                    {formatCurrency(gpData.reduce((sum, item) => sum + item.totalExpense, 0))}
                                </td>
                                <td style={{ padding: '16px', textAlign: 'right', color: '#059669' }}>
                                    {formatCurrency(gpData.reduce((sum, item) => sum + item.profit, 0))}
                                </td>
                                <td style={{ padding: '16px', textAlign: 'right', color: '#059669' }}>
                                    {/* Overall GP % */}
                                    {(() => {
                                        const totalTov = gpData.reduce((sum, item) => sum + item.tov, 0);
                                        const totalProfit = gpData.reduce((sum, item) => sum + item.profit, 0);
                                        return formatPercent(totalTov > 0 ? (totalProfit / totalTov) * 100 : 0);
                                    })()}
                                </td>
                                <td></td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Detail Modal */}
            <DetailModal />
        </div>
    );
};

export default GP;
