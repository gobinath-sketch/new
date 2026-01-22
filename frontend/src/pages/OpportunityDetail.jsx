import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Table.css';

const OpportunityDetail = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [opportunity, setOpportunity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && id !== 'undefined') {
      fetchOpportunity();
    } else {
      console.warn('Invalid Opportunity ID:', id);
      setLoading(false);
    }
  }, [id]);

  const fetchOpportunity = async () => {
    try {
      const response = await api.get(`/opportunities/${id}`);
      setOpportunity(response.data);
    } catch (error) {
      console.error('Error fetching opportunity:', error);
      alert('Error loading opportunity details');
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
        <h2>Opportunity Information</h2>

        <div className="form-grid">
          <div className="form-group">
            <label><strong>Adhoc ID</strong></label>
            <div className="display-field strong">
              {opportunity.opportunityId}
            </div>
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

          <div className="form-group">
            <label><strong>Sales</strong></label>
            <div>{opportunity.sales || 'N/A'}</div>
          </div>

          <div className="form-group">
            <label><strong>Training Year</strong></label>
            <div>{opportunity.trainingYear || new Date(opportunity.createdAt).getFullYear()}</div>
          </div>

          <div className="form-group">
            <label><strong>Training Month</strong></label>
            <div>{opportunity.trainingMonth || new Date(opportunity.createdAt).toLocaleString('default', { month: 'long' })}</div>
          </div>

          <div className="form-group">
            <label><strong>Adhoc ID</strong></label>
            <div>{opportunity.adhocId || 'N/A'}</div>
          </div>

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
            <label><strong>Attendance</strong></label>
            <div>{opportunity.attendance || 0}</div>
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

          <div className="form-group">
            <label><strong>TOV (Billing Amount)</strong></label>
            <div>₹{(opportunity.tov || opportunity.expectedCommercialValue || 0).toLocaleString()}</div>
          </div>

          <div className="form-group">
            <label><strong>PO</strong></label>
            <div>{opportunity.po || 'N/A'}</div>
          </div>

          <div className="form-group">
            <label><strong>PO Date</strong></label>
            <div>{opportunity.poDate ? new Date(opportunity.poDate).toLocaleDateString() : 'N/A'}</div>
          </div>

          <div className="form-group">
            <label><strong>Invoice Number</strong></label>
            <div>{opportunity.invoiceNumber || 'N/A'}</div>
          </div>

          <div className="form-group">
            <label><strong>Invoice Date</strong></label>
            <div>{opportunity.invoiceDate ? new Date(opportunity.invoiceDate).toLocaleDateString() : 'N/A'}</div>
          </div>

          <div className="form-group">
            <label><strong>Payment Terms</strong></label>
            <div>{opportunity.paymentTerms || 'N/A'}</div>
          </div>

          <div className="form-group">
            <label><strong>Payment Date</strong></label>
            <div>{opportunity.paymentDate ? new Date(opportunity.paymentDate).toLocaleDateString() : 'N/A'}</div>
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
            <label><strong>Venue</strong></label>
            <div>{opportunity.venue || 'N/A'}</div>
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

          <div className="form-group">
            <label><strong>Final GP (Gross Profit)</strong></label>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: opportunity.finalGP >= 0 ? '#28a745' : '#dc3545' }}>
              {opportunity.tov && opportunity.tov > 0
                ? `${((opportunity.finalGP || 0) / opportunity.tov * 100).toFixed(2)}% (₹${(opportunity.finalGP || 0).toLocaleString()})`
                : `₹${(opportunity.finalGP || 0).toLocaleString()}`
              }
            </div>
          </div>

          <div className="form-group">
            <label><strong>Created By</strong></label>
            <div>{opportunity.salesExecutiveId?.name || 'N/A'}</div>
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
              <div style={{ padding: '8px', backgroundColor: '#f9f9f9', borderRadius: '4px', whiteSpace: 'pre-wrap' }}>
                {opportunity.notes}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OpportunityDetail;
