import { useState, useEffect } from 'react';
import api from '../services/api';
import './Table.css';
import ClientForm from '../components/ClientForm.jsx';
import { useModal } from '../contexts/context/ModalContext.jsx';

const Invoices = ({ user }) => {
  const [activeTab, setActiveTab] = useState('client');
  const [invoices, setInvoices] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [dropdownOptions, setDropdownOptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showClientForm, setShowClientForm] = useState(false);
  const modal = useModal();
  const [formData, setFormData] = useState({
    programId: '',
    clientName: '',
    invoiceAmount: '',
    gstType: 'IGST',
    gstPercent: '18',
    sacCode: '',
    tdsPercent: '0',
    status: 'Draft'
  });

  useEffect(() => {
    fetchInvoices();
    fetchPrograms();
    fetchDropdownOptions();
  }, []);

  useEffect(() => {
    // Auto-determine GST Type based on location if program is selected
    if (formData.programId) {
      const program = programs.find(p => p._id === formData.programId);
      if (program && program.location) {
        // Simple logic: if location contains state name, use CGST+SGST, else IGST
        // For now, default to IGST (inter-state)
        // In production, this would check against a state master
        if (formData.gstType === 'IGST' || formData.gstType === '') {
          // Keep current or set default
        }
      }
    }
  }, [formData.programId, programs]);

  const fetchDropdownOptions = async () => {
    try {
      const response = await api.get('/dropdown-options');
      setDropdownOptions(response.data);
    } catch (error) {
      console.error('Error fetching dropdown options:', error);
    }
  };

  const fetchInvoices = async () => {
    try {
      const response = await api.get('/invoices');
      setInvoices(response.data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrograms = async () => {
    try {
      const response = await api.get('/programs');
      setPrograms(response.data.filter(p => p.clientSignOff));
    } catch (error) {
      console.error('Error fetching programs:', error);
    }
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    try {
      const program = programs.find(p => p._id === formData.programId);
      await api.post('/invoices', {
        ...formData,
        clientName: program?.clientName || formData.clientName,
        invoiceDate: new Date().toISOString()
      });
      setShowInvoiceForm(false);
      setFormData({
        programId: '',
        clientName: '',
        invoiceAmount: '',
        gstType: 'IGST',
        gstPercent: '18',
        sacCode: '',
        tdsPercent: '0',
        status: 'Draft'
      });
      fetchInvoices();
      fetchDropdownOptions();
    } catch (error) {
      console.error('Error creating invoice:', error);
    }
  };

  const handleClientCreated = () => {
    setShowClientForm(false);
    fetchPrograms(); // Refresh programs as they might depend on clients (though technically programs depend on deals/clients)
    // Actually, client creation doesn't directly affect dropdowns here unless we reload programs or something. 
    // But it's good practice.
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'flex-start', marginBottom: '24px' }}>
        <h1 className="page-title">Invoices</h1>

        {/* Toggle Switch */}
        <div style={{ display: 'flex', background: '#f3f4f6', padding: '4px', borderRadius: '8px' }}>
          <button
            onClick={() => setActiveTab('client')}
            style={{
              padding: '8px 24px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'client' ? 'white' : 'transparent',
              color: activeTab === 'client' ? '#6366f1' : '#6b7280',
              fontWeight: activeTab === 'client' ? '600' : '500',
              boxShadow: activeTab === 'client' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Client
          </button>
          <button
            onClick={() => setActiveTab('vendor')}
            style={{
              padding: '8px 24px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'vendor' ? 'white' : 'transparent',
              color: activeTab === 'vendor' ? '#6366f1' : '#6b7280',
              fontWeight: activeTab === 'vendor' ? '600' : '500',
              boxShadow: activeTab === 'vendor' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Vendor
          </button>
        </div>
      </div>

      {activeTab === 'vendor' ? (
        // VENDOR TAB - FILE UPLOAD
        <div className="upload-container" style={{
          background: 'white',
          padding: '40px',
          borderRadius: '12px',
          border: '2px dashed #e5e7eb',
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: '16px', color: '#6366f1' }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Upload Vendor Invoice</h3>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>Drag and drop your file here, or click to browse</p>
          <button className="btn-primary">Select File</button>
        </div>
      ) : (
        // CLIENT TAB - EXISTING FUNCTIONALITY + CLIENT CREATION
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '24px' }}>
            <button
              onClick={() => {
                setShowClientForm(!showClientForm);
                setShowInvoiceForm(false);
              }}
              className="btn-secondary"
            >
              {showClientForm ? 'Cancel Client' : 'Create Client'}
            </button>
            <button
              onClick={() => {
                setShowInvoiceForm(!showInvoiceForm);
                setShowClientForm(false);
              }}
              className="btn-primary"
            >
              {showInvoiceForm ? 'Cancel Invoice' : 'Generate Invoice'}
            </button>
          </div>

          {showClientForm && (
            <ClientForm
              user={user}
              onSuccess={handleClientCreated}
              onCancel={() => setShowClientForm(false)}
            />
          )}

          {showInvoiceForm && (
            <form onSubmit={handleCreateInvoice} className="form-card">
              <h2>Generate Invoice</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>Program</label>
                  <select value={formData.programId} onChange={(e) => {
                    const program = programs.find(p => p._id === e.target.value);
                    setFormData({
                      ...formData,
                      programId: e.target.value,
                      clientName: program?.clientName || formData.clientName,
                      sacCode: program?.sacCode || formData.sacCode
                    });
                  }} required>
                    <option value="">Select Program</option>
                    {programs.map(program => (
                      <option key={program._id} value={program._id}>{program.programName} - {program.clientName}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Client Name</label>
                  <input type="text" value={formData.clientName} onChange={(e) => setFormData({ ...formData, clientName: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Invoice Amount</label>
                  <input type="number" value={formData.invoiceAmount} onChange={(e) => setFormData({ ...formData, invoiceAmount: e.target.value })} step="any" required />
                </div>
                <div className="form-group">
                  <label>GST Type</label>
                  <select
                    value={formData.gstType}
                    onChange={(e) => setFormData({ ...formData, gstType: e.target.value })}
                    required
                  >
                    <option value="">Select GST Type</option>
                    {dropdownOptions.gstType?.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>GST %</label>
                  <input
                    type="number"
                    value={formData.gstPercent}
                    onChange={(e) => setFormData({ ...formData, gstPercent: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>SAC Code</label>
                  <input
                    type="text"
                    value={formData.sacCode}
                    onChange={(e) => setFormData({ ...formData, sacCode: e.target.value })}
                    required
                    readOnly={user.role === 'Finance Manager'}
                    style={user.role === 'Finance Manager' ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                  />
                </div>
                <div className="form-group">
                  <label>TDS %</label>
                  <input
                    type="number"
                    value={formData.tdsPercent}
                    onChange={(e) => setFormData({ ...formData, tdsPercent: e.target.value })}
                    readOnly={user.role === 'Finance Manager'}
                    style={user.role === 'Finance Manager' ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                  />
                  {user.role === 'Finance Manager' && (
                    <small style={{ display: 'block', marginTop: '4px', color: '#666' }}>
                      TDS is system-calculated
                    </small>
                  )}
                </div>
                <div className="form-group">
                  <label>Invoice Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    required
                  >
                    <option value="">Select Status</option>
                    {dropdownOptions.invoiceStatus?.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button type="submit" className="btn-primary">Generate Invoice</button>
            </form>
          )}

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice Number</th>
                  <th>Client</th>
                  <th>Amount</th>
                  <th>Total</th>
                  <th>IRN</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(invoice => (
                  <tr key={invoice._id}>
                    <td>{invoice.clientInvoiceNumber}</td>
                    <td>{invoice.clientName}</td>
                    <td>₹{invoice.invoiceAmount.toLocaleString()}</td>
                    <td>₹{invoice.totalAmount.toLocaleString()}</td>
                    <td>{invoice.irnNumber || '-'}</td>
                    <td><span className={`status-badge ${invoice.status.toLowerCase()}`}>{invoice.status}</span></td>
                    <td>
                      <button
                        onClick={() => {
                          modal.alert({
                            title: 'Invoice Details',
                            okText: 'Close',
                            type: 'info',
                            containerClassName: 'modal-wide',
                            message: (
                              <div className="modal-scroll-area">
                                <h4 className="modal-section-title">Summary</h4>
                                <div className="modal-kv-grid">
                                  <div className="modal-kv-label">Invoice Number</div>
                                  <div className="modal-kv-value">{invoice.clientInvoiceNumber || 'N/A'}</div>

                                  <div className="modal-kv-label">Client</div>
                                  <div className="modal-kv-value">{invoice.clientName || 'N/A'}</div>

                                  <div className="modal-kv-label">Deal ID</div>
                                  <div className="modal-kv-value">{invoice.dealId?.dealId || 'N/A'}</div>

                                  <div className="modal-kv-label">Invoice Date</div>
                                  <div className="modal-kv-value">{invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : 'N/A'}</div>

                                  <div className="modal-kv-label">Status</div>
                                  <div className="modal-kv-value">{invoice.status || 'N/A'}</div>
                                </div>

                                <div style={{ height: '16px' }} />

                                <h4 className="modal-section-title">Amounts</h4>
                                <div className="modal-kv-grid">
                                  <div className="modal-kv-label">Invoice Amount</div>
                                  <div className="modal-kv-value">₹{(invoice.invoiceAmount || 0).toLocaleString()}</div>

                                  <div className="modal-kv-label">GST Amount</div>
                                  <div className="modal-kv-value">₹{(invoice.gstAmount || 0).toLocaleString()}</div>

                                  <div className="modal-kv-label">Total Amount</div>
                                  <div className="modal-kv-value">₹{(invoice.totalAmount || 0).toLocaleString()}</div>

                                  <div className="modal-kv-label">TDS Amount</div>
                                  <div className="modal-kv-value">₹{(invoice.tdsAmount || 0).toLocaleString()}</div>

                                  <div className="modal-kv-label">Net Receivable</div>
                                  <div className="modal-kv-value">₹{(invoice.netReceivable || 0).toLocaleString()}</div>
                                </div>

                                <div style={{ height: '16px' }} />

                                <h4 className="modal-section-title">Tax</h4>
                                <div className="modal-kv-grid">
                                  <div className="modal-kv-label">IRN Number</div>
                                  <div className="modal-kv-value">{invoice.irnNumber || 'N/A'}</div>
                                </div>

                                <div style={{ height: '16px' }} />

                                <h4 className="modal-section-title">Audit</h4>
                                <div className="modal-kv-grid">
                                  <div className="modal-kv-label">Created Date</div>
                                  <div className="modal-kv-value">{invoice.createdAt ? new Date(invoice.createdAt).toLocaleString() : 'N/A'}</div>
                                </div>
                              </div>
                            )
                          });
                        }}
                        className="btn-small"
                        style={{ backgroundColor: '#007bff', color: 'white' }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default Invoices;
