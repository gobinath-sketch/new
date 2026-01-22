import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import './Table.css';
import TaxCalculator from '../components/TaxCalculator';

const Payables = ({ user }) => {
    const [loading, setLoading] = useState(false);

    // Core Fields
    const [adhocId, setAdhocId] = useState('');
    const [expenseType, setExpenseType] = useState('Trainer'); // Default

    // Complex Form Data (PO & Invoice)
    const [poData, setPoData] = useState({
        poNumber: '',
        poDate: ''
    });

    const [invoiceData, setInvoiceData] = useState({
        invoiceNumber: '',
        invoiceDate: '',
        paymentTerms: '',
        paymentDate: ''
    });

    // Simple Form Data (Per Diem / Other)
    const [simpleData, setSimpleData] = useState({
        amount: '',
        description: '' // Optional description maybe?
    });

    const expenseOptions = [
        'Trainer',
        'Travel',
        'Accommodation',
        'Venue',
        'Course Materials',
        'Lab',
        'Royalty',
        'Marketing Charges',
        'Per Diem',
        'Other Expenses'
    ];

    const simpleTypes = ['Per Diem', 'Other Expenses'];

    useEffect(() => {
        // Auto-calculate Payment Date for Invoice
        if (invoiceData.invoiceDate && invoiceData.paymentTerms) {
            const days = parseInt(invoiceData.paymentTerms);
            if (!isNaN(days)) {
                const date = new Date(invoiceData.invoiceDate);
                date.setDate(date.getDate() + days);
                const formattedDate = date.toISOString().split('T')[0];
                setInvoiceData(prev => ({ ...prev, paymentDate: formattedDate }));
            } else {
                setInvoiceData(prev => ({ ...prev, paymentDate: '' }));
            }
        } else {
            setInvoiceData(prev => ({ ...prev, paymentDate: '' }));
        }
    }, [invoiceData.invoiceDate, invoiceData.paymentTerms]);

    // Fetch Opportunities for Adhoc ID suggestion
    const [opportunities, setOpportunities] = useState([]);

    useEffect(() => {
        const fetchOpps = async () => {
            try {
                const res = await api.get('/opportunities');
                setOpportunities(res.data || []);
            } catch (err) {
                console.error("Failed to fetch opportunities", err);
            }
        };
        fetchOpps();
    }, []);

    const FileUploadUI = ({ title, multiple = true }) => {
        const inputRef = useRef(null);
        const [files, setFiles] = useState([]);

        const handleFileChange = (e) => {
            if (e.target.files && e.target.files.length > 0) {
                setFiles(Array.from(e.target.files));
            }
        };

        return (
            <div style={{
                border: '2px dashed #e5e7eb',
                borderRadius: '8px',
                padding: '20px',
                textAlign: 'center',
                marginTop: '15px',
                backgroundColor: '#fafafa'
            }}>
                <input
                    type="file"
                    ref={inputRef}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    multiple={multiple}
                    accept=".xlsx,.xls,.doc,.docx,.pdf,image/*"
                />
                <div style={{ marginBottom: '10px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>{title}</span>
                </div>
                <button
                    type="button"
                    onClick={() => inputRef.current.click()}
                    className="btn-secondary"
                    style={{ fontSize: '13px', padding: '6px 12px' }}
                >
                    Choose Files
                </button>
                <div style={{ marginTop: '10px', fontSize: '12px', color: '#6b7280' }}>
                    {files.length > 0 ? (
                        <div style={{ color: '#059669' }}>
                            {files.length} file(s) selected
                            <ul style={{ listStyle: 'none', padding: 0, marginTop: '4px' }}>
                                {files.map((f, i) => <li key={i}>{f.name}</li>)}
                            </ul>
                        </div>
                    ) : (
                        'No file chosen (Excel, Word, PDF)'
                    )}
                </div>
            </div>
        );
    };

    const handleSubmit = async () => {
        if (!adhocId) {
            alert('Please select an Adhoc ID linked to an Opportunity.');
            return;
        }

        const payload = {
            adhocId,
            expenseType,
            // Add simple vs complex logic here
            ...(isSimpleType ? {
                amount: simpleData.amount,
                description: simpleData.description
            } : {
                poNumber: poData.poNumber,
                poDate: poData.poDate,
                invoiceNumber: invoiceData.invoiceNumber,
                invoiceDate: invoiceData.invoiceDate,
                paymentTerms: invoiceData.paymentTerms,
                paymentDate: invoiceData.paymentDate
            })
        };

        try {
            setLoading(true);
            await api.post('/payables', payload);
            alert('Payables saved successfully!');
            // Reset form
            setAdhocId('');
            setPoData({ poNumber: '', poDate: '' });
            setInvoiceData({ invoiceNumber: '', invoiceDate: '', paymentTerms: '', paymentDate: '' });
            setSimpleData({ amount: '', description: '' });
        } catch (error) {
            console.error('Error saving payables:', error);
            alert('Failed to save payables. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const isSimpleType = simpleTypes.includes(expenseType);

    return (
        <div>
            <div className="page-header" style={{ marginBottom: '24px' }}>
                <h1 className="page-title">Vendor Payables</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isSimpleType ? '1fr' : '1fr 1fr', gap: '30px', marginBottom: '30px' }}>

                {/* Left Column / Main Card */}
                <div className="card" style={{ padding: '24px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <h2 style={{ fontSize: '18px', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                        {isSimpleType ? 'Expense Details' : 'Vendor PO'}
                    </h2>

                    <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Adhoc ID (Select Opportunity)</label>
                        <input
                            list="adhoc-options"
                            type="text"
                            value={adhocId}
                            onChange={(e) => setAdhocId(e.target.value)}
                            className="form-control"
                            placeholder="Search or Select Adhoc ID"
                            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                        />
                        <datalist id="adhoc-options">
                            {opportunities.map(opp => (
                                <option key={opp.id} value={opp.adhocId}>
                                    {opp.clientName} - {opp.salesOwner || opp.salesName}
                                </option>
                            ))}
                        </datalist>
                    </div>

                    <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Vendor Type</label>
                        <select
                            value={expenseType}
                            onChange={(e) => setExpenseType(e.target.value)}
                            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '15px' }}
                        >
                            {expenseOptions.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>

                    {isSimpleType ? (
                        // Simple View (Per Diem / Other)
                        <>
                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Amount</label>
                                <input
                                    type="number"
                                    value={simpleData.amount}
                                    onChange={(e) => setSimpleData({ ...simpleData, amount: e.target.value })}
                                    className="form-control"
                                    placeholder="Enter Amount"
                                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                                />
                            </div>

                            <FileUploadUI title="Upload Attachments" />
                        </>
                    ) : (
                        // Complex View - PO Part
                        <>
                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Vendor PO Number</label>
                                <input
                                    type="text"
                                    value={poData.poNumber}
                                    onChange={(e) => setPoData({ ...poData, poNumber: e.target.value })}
                                    className="form-control"
                                    placeholder="Enter PO Number"
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Vendor PO Date</label>
                                <input
                                    type="date"
                                    value={poData.poDate}
                                    onChange={(e) => setPoData({ ...poData, poDate: e.target.value })}
                                    className="form-control"
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                />
                            </div>

                            <FileUploadUI title="Upload Vendor PO" />
                        </>
                    )}
                </div>

                {/* Right Column - Only for Complex Types */}
                {!isSimpleType && (
                    <div className="card" style={{ padding: '24px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <h2 style={{ fontSize: '18px', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Vendor Invoice</h2>

                        <div className="form-group" style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Vendor Invoice Number</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Enter Invoice Number"
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                value={invoiceData.invoiceNumber}
                                onChange={(e) => setInvoiceData({ ...invoiceData, invoiceNumber: e.target.value })}
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Vendor Invoice Date</label>
                            <input
                                type="date"
                                className="form-control"
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                value={invoiceData.invoiceDate}
                                onChange={(e) => setInvoiceData({ ...invoiceData, invoiceDate: e.target.value })}
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Payment Terms (Days)</label>
                            <input
                                type="number"
                                className="form-control"
                                placeholder="Enter number of days"
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                value={invoiceData.paymentTerms}
                                onChange={(e) => setInvoiceData({ ...invoiceData, paymentTerms: e.target.value })}
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Payment Date</label>
                            <input
                                type="date"
                                className="form-control"
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                value={invoiceData.paymentDate}
                                readOnly
                            />
                        </div>

                        <div style={{ marginTop: '20px', marginBottom: '20px' }}>
                            <TaxCalculator title="Vendor Amount Payable" />
                        </div>

                        <FileUploadUI title="Upload Vendor Invoice" />
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: '40px' }}>
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="btn-primary"
                    style={{
                        padding: '12px 30px',
                        fontSize: '16px',
                        background: '#dc2626', // Different color for Payables (Red-ish) to distinguish
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.7 : 1
                    }}
                >
                    {loading ? 'Saving...' : 'Save Payables'}
                </button>
            </div>
        </div>
    );
};

export default Payables;
