import { useState, useEffect } from 'react';
import api from '../services/api';
import './Table.css';
import TaxCalculator from '../components/TaxCalculator.jsx';
import { useModal } from '../contexts/context/ModalContext.jsx';
import FileUpload from '../components/FileUpload.jsx';

const Payables = ({ user }) => {
    const [loading, setLoading] = useState(false);
    const modal = useModal();

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

 

    const handleSubmit = async () => {
        if (!adhocId) {
            modal.alert({
                title: 'Validation',
                message: 'Please select an Adhoc ID linked to an Opportunity.',
                okText: 'Close',
                type: 'warning'
            });
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
            modal.alert({
                title: 'Saved',
                message: 'Payables saved successfully!',
                okText: 'Close',
                type: 'info'
            });
            // Reset form
            setAdhocId('');
            setPoData({ poNumber: '', poDate: '' });
            setInvoiceData({ invoiceNumber: '', invoiceDate: '', paymentTerms: '', paymentDate: '' });
            setSimpleData({ amount: '', description: '' });
        } catch (error) {
            console.error('Error saving payables:', error);
            modal.alert({
                title: 'Error',
                message: 'Failed to save payables. Please try again.',
                okText: 'Close',
                type: 'danger'
            });
        } finally {
            setLoading(false);
        }
    };

    const isSimpleType = simpleTypes.includes(expenseType);

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Vendor Payables</h1>
            </div>

            <div className={isSimpleType ? 'payables-grid single' : 'payables-grid'}>
                <div className="form-card">
                    <h2>{isSimpleType ? 'Expense Details' : 'Vendor PO'}</h2>

                    <div className="form-grid">
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label>Adhoc ID (Select Opportunity)</label>
                            <input
                                list="adhoc-options"
                                type="text"
                                value={adhocId}
                                onChange={(e) => setAdhocId(e.target.value)}
                                placeholder="Search or Select Adhoc ID"
                            />
                            <datalist id="adhoc-options">
                                {opportunities.map(opp => (
                                    <option key={opp.id} value={opp.adhocId}>
                                        {opp.clientName} - {opp.salesOwner || opp.salesName}
                                    </option>
                                ))}
                            </datalist>
                        </div>

                        <div className="form-group">
                            <label>Vendor Type</label>
                            <select
                                value={expenseType}
                                onChange={(e) => setExpenseType(e.target.value)}
                            >
                                {expenseOptions.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>

                        {isSimpleType ? (
                            <div className="form-group">
                                <label>Amount</label>
                                <input
                                    type="number"
                                    value={simpleData.amount}
                                    onChange={(e) => setSimpleData({ ...simpleData, amount: e.target.value })}
                                    placeholder="Enter Amount"
                                />
                            </div>
                        ) : (
                            <>
                                <div className="form-group">
                                    <label>Vendor PO Number</label>
                                    <input
                                        type="text"
                                        value={poData.poNumber}
                                        onChange={(e) => setPoData({ ...poData, poNumber: e.target.value })}
                                        placeholder="Enter PO Number"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Vendor PO Date</label>
                                    <input
                                        type="date"
                                        value={poData.poDate}
                                        onChange={(e) => setPoData({ ...poData, poDate: e.target.value })}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    {isSimpleType ? (
                        <FileUpload label="Upload Attachments" />
                    ) : (
                        <FileUpload label="Upload Vendor PO" />
                    )}
                </div>

                {!isSimpleType && (
                    <div className="form-card">
                        <h2>Vendor Invoice</h2>

                        <div className="form-grid">
                            <div className="form-group">
                                <label>Vendor Invoice Number</label>
                                <input
                                    type="text"
                                    placeholder="Enter Invoice Number"
                                    value={invoiceData.invoiceNumber}
                                    onChange={(e) => setInvoiceData({ ...invoiceData, invoiceNumber: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>Vendor Invoice Date</label>
                                <input
                                    type="date"
                                    value={invoiceData.invoiceDate}
                                    onChange={(e) => setInvoiceData({ ...invoiceData, invoiceDate: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>Payment Terms (Days)</label>
                                <input
                                    type="number"
                                    placeholder="Enter number of days"
                                    value={invoiceData.paymentTerms}
                                    onChange={(e) => setInvoiceData({ ...invoiceData, paymentTerms: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>Payment Date</label>
                                <input
                                    type="date"
                                    value={invoiceData.paymentDate}
                                    readOnly
                                />
                            </div>
                        </div>

                        <div className="tax-block">
                            <TaxCalculator title="Vendor Amount Payable" />
                        </div>

                        <FileUpload label="Upload Vendor Invoice" />
                    </div>
                )}
            </div>

            <div className="form-actions">
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="btn-primary"
                >
                    {loading ? 'Saving...' : 'Save Payables'}
                </button>
            </div>
        </div>
    );
};

export default Payables;
