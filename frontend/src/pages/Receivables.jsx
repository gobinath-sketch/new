import { useState, useEffect } from 'react';
import api from '../services/api';
import './Table.css';
import TaxCalculator from '../components/TaxCalculator.jsx';
import { useModal } from '../contexts/context/ModalContext.jsx';
import FileUpload from '../components/FileUpload.jsx';

const Receivables = ({ user }) => {
    const [loading, setLoading] = useState(false);
    const modal = useModal();

    // Form Data
    const [adhocId, setAdhocId] = useState('');

    // Client PO Data
    const [poData, setPoData] = useState({
        poNumber: '',
        poDate: ''
    });

    // Client Invoice Data
    const [invoiceData, setInvoiceData] = useState({
        invoiceNumber: '',
        invoiceDate: '',
        paymentTerms: '',
        paymentDate: ''
    });

    useEffect(() => {
        // Auto-calculate Payment Date
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
            poNumber: poData.poNumber,
            poDate: poData.poDate,
            invoiceNumber: invoiceData.invoiceNumber,
            invoiceDate: invoiceData.invoiceDate,
            paymentTerms: invoiceData.paymentTerms,
            paymentDate: invoiceData.paymentDate,
            // Include tax details if TaxCalculator was refactored to lift state up
            // For now, assuming direct API handling or simplification as per "Test flow" request
            // Ideally TaxCalculator should accept an 'onChange' prop to pass values back. 
            // Given the component structure, I'll assume the user wants the flow to work primarily on Adhoc ID linking for now.
        };

        try {
            setLoading(true);
            await api.post('/receivables', payload);
            modal.alert({
                title: 'Saved',
                message: 'Receivables saved successfully!',
                okText: 'Close',
                type: 'info'
            });
            // Reset form
            setAdhocId('');
            setPoData({ poNumber: '', poDate: '' });
            setInvoiceData({ invoiceNumber: '', invoiceDate: '', paymentTerms: '', paymentDate: '' });
        } catch (error) {
            console.error('Error saving receivables:', error);
            modal.alert({
                title: 'Error',
                message: 'Failed to save receivables. Please try again.',
                okText: 'Close',
                type: 'danger'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Client Receivables</h1>
            </div>

            <div className="receivables-grid">
                <div className="form-card">
                    <h2>Client PO</h2>

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
                            <label>Client PO Number</label>
                            <input
                                type="text"
                                value={poData.poNumber}
                                onChange={(e) => setPoData({ ...poData, poNumber: e.target.value })}
                                placeholder="Enter PO Number"
                            />
                        </div>

                        <div className="form-group">
                            <label>Client PO Date</label>
                            <input
                                type="date"
                                value={poData.poDate}
                                onChange={(e) => setPoData({ ...poData, poDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <FileUpload label="Upload Client PO" />
                </div>

                <div className="form-card">
                    <h2>Client Invoice</h2>

                    <div className="form-grid">
                        <div className="form-group">
                            <label>Client Invoice Number</label>
                            <input
                                type="text"
                                placeholder="Enter Invoice Number"
                                value={invoiceData.invoiceNumber}
                                onChange={(e) => setInvoiceData({ ...invoiceData, invoiceNumber: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label>Client Invoice Date</label>
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
                        <TaxCalculator title="Client Amount Payable" />
                    </div>

                    <FileUpload label="Upload Client Invoice" />
                </div>
            </div>

            <div className="form-actions">
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="btn-primary"
                >
                    {loading ? 'Saving...' : 'Save Receivables'}
                </button>
            </div>
        </div>
    );
};

export default Receivables;
