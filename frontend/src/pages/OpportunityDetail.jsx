import { useMemo, useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Table.css';
import { useModal } from '../contexts/context/ModalContext.jsx';

const OpportunityDetail = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [opportunity, setOpportunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [uploading, setUploading] = useState({ proposal: false, po: false, invoice: false });
  const modal = useModal();

  useEffect(() => {
    if (id && id !== 'undefined') {
      fetchOpportunity();
    } else {
      console.warn('Invalid Opportunity ID:', id);
      setLoading(false);
    }
  }, [id]);

  const tabs = useMemo(() => {
    const baseTabs = [
      { key: 'overview', label: 'Overview' },
      { key: 'sales', label: 'Sales' },
      { key: 'finance', label: 'Finance' },
      { key: 'workflow', label: 'Workflow' },
      { key: 'documents', label: 'Documents' }
    ];
    // Add Delivery tab for Operations Manager
    if (user?.role === 'Operations Manager') {
      baseTabs.push({ key: 'delivery', label: 'Delivery' });
    }
    return baseTabs;
  }, [user?.role]);

  const tabKeys = useMemo(() => new Set(tabs.map((t) => t.key)), [tabs]);

  const setTab = (next) => {
    const key = String(next || '').trim();
    if (!tabKeys.has(key)) return;
    setActiveTab(key);
    const params = new URLSearchParams(location.search || '');
    params.set('tab', key);
    navigate({ pathname: location.pathname, search: `?${params.toString()}` }, { replace: true });
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search || '');
    const tab = (params.get('tab') || '').trim();
    if (tab && tabKeys.has(tab)) setActiveTab(tab);
    else if (tab && !tabKeys.has(tab)) setTab('overview');
  }, [location.search, tabKeys]);

  const fetchOpportunity = async () => {
    try {
      const response = await api.get(`/opportunities/${id}`);
      setOpportunity(response.data);
    } catch (error) {
      console.error('Error fetching opportunity:', error);
      modal.alert({
        title: 'Error',
        message: 'Error loading opportunity details',
        okText: 'Close',
        type: 'danger'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="dashboard-loading">Loading opportunity details...</div>;
  }

  if (!opportunity) {
    return <div>Opportunity not found</div>;
  }

  const canUploadDocuments = useMemo(() => {
    const role = user?.role;
    return role === 'Sales Executive' || role === 'Sales Manager' || role === 'Operations Manager' || role === 'Finance Manager' || role === 'Business Head' || role === 'Director';
  }, [user?.role]);

  const openDoc = (url) => {
    if (!url) return;
    const full = url.startsWith('http') ? url : url;
    window.open(full, '_blank', 'noopener,noreferrer');
  };

  const uploadDoc = async (kind, file) => {
    if (!file) return;
    const map = {
      proposal: 'proposal',
      po: 'po',
      invoice: 'invoice'
    };
    const endpoint = map[kind];
    if (!endpoint) return;

    const form = new FormData();
    form.append('file', file);

    try {
      setUploading((prev) => ({ ...prev, [kind]: true }));
      await api.post(`/opportunities/${id}/upload/${endpoint}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await fetchOpportunity();
    } catch (error) {
      modal.alert({
        title: 'Upload Failed',
        message: error.response?.data?.error || error.message || 'Failed to upload document',
        okText: 'Close',
        type: 'danger'
      });
    } finally {
      setUploading((prev) => ({ ...prev, [kind]: false }));
    }
  };

  const TabButton = ({ tabKey, label }) => (
    <button
      type="button"
      className={activeTab === tabKey ? 'btn-small btn-primary' : 'btn-small'}
      onClick={() => setTab(tabKey)}
    >
      {label}
    </button>
  );

  const renderOverview = () => (
    <div className="form-grid">
      <div className="form-group">
        <label><strong>Adhoc ID</strong></label>
        <div className="display-field strong">{opportunity.opportunityId}</div>
      </div>

      <div className="form-group">
        <label><strong>Status</strong></label>
        <div>
          <span className={`status-badge ${(opportunity.opportunityStatus || opportunity.trainingStatus || 'New').toLowerCase().replace(' ', '-')}`}>
            {opportunity.opportunityStatus || opportunity.trainingStatus || 'New'}
          </span>
        </div>
      </div>

      <div className="form-group">
        <label><strong>Training Opportunity</strong></label>
        <div>{opportunity.trainingOpportunity || opportunity.opportunityType || 'N/A'}</div>
      </div>

      <div className="form-group">
        <label><strong>Training Sector</strong></label>
        <div>{opportunity.trainingSector || opportunity.serviceCategory || 'N/A'}</div>
      </div>

      <div className="form-group">
        <label><strong>Training Status</strong></label>
        <div>{opportunity.trainingStatus || 'N/A'}</div>
      </div>

      <div className="form-group">
        <label><strong>Training Supporter</strong></label>
        <div>{opportunity.trainingSupporter || 'N/A'}</div>
      </div>
    </div>
  );

  const renderSales = () => (
    <div className="form-grid">
      <div className="form-group">
        <label><strong>Billing Client</strong></label>
        <div>{opportunity.billingClient || 'N/A'}</div>
      </div>

      <div className="form-group">
        <label><strong>End Client</strong></label>
        <div>{opportunity.endClient || opportunity.clientCompanyName || 'N/A'}</div>
      </div>

      <div className="form-group">
        <label><strong>Course Code</strong></label>
        <div>{opportunity.courseCode || 'N/A'}</div>
      </div>

      <div className="form-group">
        <label><strong>Course Name</strong></label>
        <div>{opportunity.courseName || 'N/A'}</div>
      </div>

      <div className="form-group">
        <label><strong>Technology</strong></label>
        <div>{opportunity.technology || 'N/A'}</div>
      </div>

      <div className="form-group">
        <label><strong>Number of Participants</strong></label>
        <div>{opportunity.numberOfParticipants || opportunity.expectedParticipants || 'N/A'}</div>
      </div>

      <div className="form-group">
        <label><strong>Start Date</strong></label>
        <div>{opportunity.startDate || opportunity.expectedStartDate ? new Date(opportunity.startDate || opportunity.expectedStartDate).toLocaleDateString() : 'N/A'}</div>
      </div>

      <div className="form-group">
        <label><strong>End Date</strong></label>
        <div>{opportunity.endDate || opportunity.expectedEndDate ? new Date(opportunity.endDate || opportunity.expectedEndDate).toLocaleDateString() : 'N/A'}</div>
      </div>

      <div className="form-group">
        <label><strong>Number of Days</strong></label>
        <div>{opportunity.numberOfDays || opportunity.expectedDuration || 'N/A'}</div>
      </div>

      <div className="form-group">
        <label><strong>Location</strong></label>
        <div>{opportunity.location || 'N/A'}</div>
      </div>

      {(opportunity.location === 'Classroom' || opportunity.location === 'Hybrid') && opportunity.trainingLocation && (
        <div className="form-group">
          <label><strong>Training Location</strong></label>
          <div>{opportunity.trainingLocation}</div>
        </div>
      )}

      <div className="form-group" style={{ gridColumn: 'span 2' }}>
        <label><strong>Trainer(s)</strong></label>
        <div>
          {opportunity.trainers && opportunity.trainers.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {opportunity.trainers.map((trainer, index) => (
                <li key={index} style={{ padding: '4px 0' }}>{trainer}</li>
              ))}
            </ul>
          ) : 'N/A'}
        </div>
      </div>
    </div>
  );

  const renderFinance = () => (
    <div className="form-grid">
      <div className="form-group">
        <label><strong>TOV (Billing Amount)</strong></label>
        <div>₹{(opportunity.tov || opportunity.expectedCommercialValue || 0).toLocaleString()}</div>
      </div>

      <div className="form-group">
        <label><strong>PO</strong></label>
        <div>{opportunity.po || 'N/A'}</div>
      </div>

      <div className="form-group">
        <label><strong>Invoice Number</strong></label>
        <div>{opportunity.invoiceNumber || 'N/A'}</div>
      </div>

      <div className="form-group">
        <label><strong>Payment Terms</strong></label>
        <div>{opportunity.paymentTerms || 'N/A'}</div>
      </div>

      <div className="form-group">
        <label><strong>Trainer PO Values</strong></label>
        <div>₹{(opportunity.trainerPOValues || 0).toLocaleString()}</div>
      </div>

      <div className="form-group">
        <label><strong>Lab PO Value</strong></label>
        <div>₹{(opportunity.labPOValue || 0).toLocaleString()}</div>
      </div>

      <div className="form-group">
        <label><strong>Course Material</strong></label>
        <div>₹{(opportunity.courseMaterial || 0).toLocaleString()}</div>
      </div>

      <div className="form-group">
        <label><strong>Royalty Charges</strong></label>
        <div>₹{(opportunity.royaltyCharges || 0).toLocaleString()}</div>
      </div>

      <div className="form-group">
        <label><strong>Travel Charges</strong></label>
        <div>₹{(opportunity.travelCharges || 0).toLocaleString()}</div>
      </div>

      <div className="form-group">
        <label><strong>Accommodation</strong></label>
        <div>₹{(opportunity.accommodation || 0).toLocaleString()}</div>
      </div>

      <div className="form-group">
        <label><strong>Per Diem</strong></label>
        <div>₹{(opportunity.perDiem || 0).toLocaleString()}</div>
      </div>

      <div className="form-group">
        <label><strong>Local Conveyance</strong></label>
        <div>₹{(opportunity.localConveyance || 0).toLocaleString()}</div>
      </div>

      <div className="form-group">
        <label><strong>Marketing Charges</strong></label>
        <div>₹{(opportunity.marketingChargesAmount || 0).toLocaleString()} {opportunity.marketingChargesPercent ? `(${opportunity.marketingChargesPercent}%)` : ''}</div>
      </div>

      <div className="form-group">
        <label><strong>Contingency</strong></label>
        <div>₹{(opportunity.contingencyAmount || 0).toLocaleString()} {opportunity.contingencyPercent ? `(${opportunity.contingencyPercent}%)` : ''}</div>
      </div>

      <div className="form-group" style={{ gridColumn: 'span 2' }}>
        <label><strong>Final GP (Gross Profit)</strong></label>
        <div className="display-field strong">
          {opportunity.tov && opportunity.tov > 0
            ? `${((opportunity.finalGP || 0) / opportunity.tov * 100).toFixed(2)}% (₹${(opportunity.finalGP || 0).toLocaleString()})`
            : `₹${(opportunity.finalGP || 0).toLocaleString()}`
          }
        </div>
      </div>
    </div>
  );

  const renderWorkflow = () => (
    <div className="form-grid">
      <div className="form-group">
        <label><strong>Created By</strong></label>
        <div>{opportunity.salesExecutiveId?.name || opportunity.salesManagerId?.name || 'N/A'}</div>
      </div>

      <div className="form-group">
        <label><strong>Created Date</strong></label>
        <div>{new Date(opportunity.createdAt).toLocaleString()}</div>
      </div>

      {opportunity.qualifiedAt && (
        <div className="form-group">
          <label><strong>Qualified Date</strong></label>
          <div>{new Date(opportunity.qualifiedAt).toLocaleString()}</div>
        </div>
      )}

      {opportunity.sentToDeliveryAt && (
        <div className="form-group">
          <label><strong>Sent to Delivery Date</strong></label>
          <div>{new Date(opportunity.sentToDeliveryAt).toLocaleString()}</div>
        </div>
      )}

      {opportunity.convertedToDealId && (
        <div className="form-group">
          <label><strong>Converted to Deal</strong></label>
          <div>{opportunity.convertedToDealId.dealId || 'N/A'}</div>
        </div>
      )}

      {opportunity.notes && (
        <div className="form-group" style={{ gridColumn: 'span 2' }}>
          <label><strong>Notes</strong></label>
          <div className="display-field" style={{ whiteSpace: 'pre-wrap' }}>{opportunity.notes}</div>
        </div>
      )}
    </div>
  );

  const renderDocuments = () => (
    <div className="form-grid">
      <div className="form-group" style={{ gridColumn: 'span 2' }}>
        <label><strong>Proposal</strong></label>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="button" className="btn-small btn-primary" disabled={!opportunity.proposalDocumentUpload} onClick={() => openDoc(opportunity.proposalDocumentUpload)}>Open</button>
          {canUploadDocuments && (
            <input
              type="file"
              accept=".pdf,image/*,.doc,.docx,.xlsx,.xls"
              disabled={uploading.proposal}
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                uploadDoc('proposal', f);
              }}
            />
          )}
        </div>
      </div>

      <div className="form-group" style={{ gridColumn: 'span 2' }}>
        <label><strong>PO</strong></label>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="button" className="btn-small btn-primary" disabled={!opportunity.clientPOUpload} onClick={() => openDoc(opportunity.clientPOUpload)}>Open</button>
          {canUploadDocuments && (
            <input
              type="file"
              accept=".pdf,image/*,.doc,.docx,.xlsx,.xls"
              disabled={uploading.po}
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                uploadDoc('po', f);
              }}
            />
          )}
        </div>
      </div>

      <div className="form-group" style={{ gridColumn: 'span 2' }}>
        <label><strong>Invoice</strong></label>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="button" className="btn-small btn-primary" disabled={!opportunity.invoiceDocumentUpload} onClick={() => openDoc(opportunity.invoiceDocumentUpload)}>Open</button>
          {canUploadDocuments && (
            <input
              type="file"
              accept=".pdf,image/*,.doc,.docx,.xlsx,.xls"
              disabled={uploading.invoice}
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                uploadDoc('invoice', f);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );

  const renderDelivery = () => (
    <div className="form-grid">
      <h3 style={{ gridColumn: 'span 2', marginBottom: '16px', color: 'var(--color-primary)' }}>Delivery Information</h3>
      
      <div className="form-group">
        <label><strong>Trainer Support</strong></label>
        <div className="display-field">{opportunity.commonDetails?.trainingSupporter || opportunity.trainingSupporter || 'GKT'}</div>
      </div>

      <div className="form-group">
        <label><strong>Technology</strong></label>
        <div className="display-field">{opportunity.technology || 'N/A'}</div>
      </div>

      <div className="form-group">
        <label><strong>Course Code</strong></label>
        <div className="display-field">{opportunity.commonDetails?.courseCode || opportunity.courseCode || 'N/A'}</div>
      </div>

      <div className="form-group">
        <label><strong>Course Name</strong></label>
        <div className="display-field">{opportunity.commonDetails?.courseName || opportunity.courseName || 'N/A'}</div>
      </div>

      <div className="form-group">
        <label><strong>Training Year</strong></label>
        <div className="display-field">{opportunity.trainingYear || new Date().getFullYear()}</div>
      </div>

      <div className="form-group">
        <label><strong>Training Month</strong></label>
        <div className="display-field">{opportunity.trainingMonth || 'N/A'}</div>
      </div>

      <div className="form-group">
        <label><strong>Number of Days</strong></label>
        <div className="display-field">{opportunity.days || opportunity.numberOfDays || 'N/A'}</div>
      </div>

      <div className="form-group">
        <label><strong>Number of Participants</strong></label>
        <div className="display-field">{opportunity.numberOfParticipants || 'N/A'}</div>
      </div>

      <div className="form-group">
        <label><strong>Start Date</strong></label>
        <div className="display-field">{opportunity.expectedStartDate ? new Date(opportunity.expectedStartDate).toLocaleDateString() : 'N/A'}</div>
      </div>

      <div className="form-group">
        <label><strong>End Date</strong></label>
        <div className="display-field">{opportunity.expectedEndDate ? new Date(opportunity.expectedEndDate).toLocaleDateString() : 'N/A'}</div>
      </div>

      <div className="form-group">
        <label><strong>Location</strong></label>
        <div className="display-field">{opportunity.location || opportunity.trainingLocation || 'N/A'}</div>
      </div>

      <div className="form-group">
        <label><strong>Mode of Training</strong></label>
        <div className="display-field">{opportunity.modeOfTraining || 'N/A'}</div>
      </div>

      <h3 style={{ gridColumn: 'span 2', marginTop: '20px', marginBottom: '16px', color: 'var(--color-primary)' }}>Expenses</h3>

      <div className="form-group">
        <label><strong>Trainer PO Value</strong></label>
        <div className="display-field">₹{(opportunity.trainerPOValues || 0).toLocaleString()}</div>
      </div>

      <div className="form-group">
        <label><strong>Lab PO Value</strong></label>
        <div className="display-field">₹{(opportunity.labPOValue || 0).toLocaleString()}</div>
      </div>

      <div className="form-group">
        <label><strong>Travel Charges</strong></label>
        <div className="display-field">₹{(opportunity.travelCharges || 0).toLocaleString()}</div>
      </div>

      <div className="form-group">
        <label><strong>Accommodation</strong></label>
        <div className="display-field">₹{(opportunity.accommodation || 0).toLocaleString()}</div>
      </div>

      <div className="form-group">
        <label><strong>Per Diem</strong></label>
        <div className="display-field">₹{(opportunity.perDiem || 0).toLocaleString()}</div>
      </div>

      <div className="form-group">
        <label><strong>Local Conveyance</strong></label>
        <div className="display-field">₹{(opportunity.localConveyance || 0).toLocaleString()}</div>
      </div>

      <h3 style={{ gridColumn: 'span 2', marginTop: '20px', marginBottom: '16px', color: 'var(--color-primary)' }}>GP Summary</h3>

      <div className="form-group">
        <label><strong>Total Order Value (TOV)</strong></label>
        <div className="display-field">₹{(opportunity.tov || opportunity.expectedCommercialValue || 0).toLocaleString()}</div>
      </div>

      <div className="form-group">
        <label><strong>GP %</strong></label>
        <div className="display-field" style={{ color: (opportunity.gpPercent || 0) < 15 ? 'var(--color-danger)' : 'var(--color-success)' }}>
          {(opportunity.gpPercent || 0).toFixed(2)}%
        </div>
      </div>

      <div className="form-group">
        <label><strong>Final GP</strong></label>
        <div className="display-field">₹{(opportunity.finalGP || 0).toLocaleString()}</div>
      </div>

      <div className="form-group">
        <label><strong>Delivery Status</strong></label>
        <div className="display-field">
          <span className={`status-badge ${opportunity.opportunityStatus === 'Sent to Delivery' ? 'pending' : ''}`}>
            {opportunity.opportunityStatus || 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );

  const renderTab = () => {
    if (activeTab === 'documents') return renderDocuments();
    if (activeTab === 'sales') return renderSales();
    if (activeTab === 'finance') return renderFinance();
    if (activeTab === 'workflow') return renderWorkflow();
    if (activeTab === 'delivery') return renderDelivery();
    return renderOverview();
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Opportunity Details</h1>
        <button
          onClick={() => navigate('/')}
          className="btn-close"
          title="Close and return to Dashboard"
        >
          ×
        </button>
      </div>

      <div className="form-card">
        <div className="page-header" style={{ marginBottom: '10px' }}>
          <h2 style={{ margin: 0 }}>Details</h2>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {tabs.map((t) => (
              <TabButton key={t.key} tabKey={t.key} label={t.label} />
            ))}
          </div>
        </div>

        {renderTab()}
      </div>
    </div>
  );
};

export default OpportunityDetail;
