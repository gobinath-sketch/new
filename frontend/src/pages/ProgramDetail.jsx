import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Table.css';

const ProgramDetail = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [program, setProgram] = useState(null);
  const [opportunity, setOpportunity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgram();
  }, [id]);

  const fetchProgram = async () => {
    try {
      const response = await api.get(`/programs/${id}`);
      setProgram(response.data);
      
      // If program is linked to an opportunity, use the populated opportunity data
      if (response.data.opportunityId && typeof response.data.opportunityId === 'object') {
        setOpportunity(response.data.opportunityId);
      } else if (response.data.opportunityId) {
        // If opportunityId is just an ID string, try to fetch it (but handle 403 gracefully)
        try {
          const oppResponse = await api.get(`/opportunities/${response.data.opportunityId}`);
          setOpportunity(oppResponse.data);
        } catch (error) {
          // Silently fail if user doesn't have access - Adhoc ID will show as N/A
          console.error('Error fetching opportunity:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching program:', error);
      alert('Error loading program details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="dashboard-loading">Loading program details...</div>;
  }

  if (!program) {
    return <div>Program not found</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Program Details</h1>
        <button 
          onClick={() => navigate('/')} 
          className="btn-close"
          title="Close and return to Dashboard"
        >
          ×
        </button>
      </div>

      <div className="form-card">
        <h2>Program Information</h2>
        
        <div className="form-grid">
          <div className="form-group">
            <label><strong>Adhoc ID</strong></label>
            <div className="display-field strong">
              {opportunity?.opportunityId || program.adhocId || 'N/A'}
            </div>
          </div>

          <div className="form-group">
            <label><strong>Status</strong></label>
            <div>
              <span className={`status-badge ${(program.trainingStatus || program.deliveryStatus || '').toLowerCase().replace(' ', '-')}`}>
                {program.trainingStatus || program.deliveryStatus || 'Scheduled'}
              </span>
            </div>
          </div>

          <div className="form-group">
            <label><strong>Training Opportunity</strong></label>
            <div>{program.trainingOpportunity || 'N/A'}</div>
          </div>

          <div className="form-group">
            <label><strong>Training Sector</strong></label>
            <div>{program.trainingSector || 'N/A'}</div>
          </div>

          <div className="form-group">
            <label><strong>Training Supporter</strong></label>
            <div>{program.trainingSupporter || 'N/A'}</div>
          </div>

          <div className="form-group">
            <label><strong>Sales</strong></label>
            <div>{program.sales || 'N/A'}</div>
          </div>

          <div className="form-group">
            <label><strong>Training Year</strong></label>
            <div>{program.trainingYear || 'N/A'}</div>
          </div>

          <div className="form-group">
            <label><strong>Training Month</strong></label>
            <div>{program.trainingMonth || 'N/A'}</div>
          </div>

          <div className="form-group">
            <label><strong>Billing Client</strong></label>
            <div>{program.billingClient || program.clientName || 'N/A'}</div>
          </div>

          <div className="form-group">
            <label><strong>End Client</strong></label>
            <div>{program.endClient || program.clientName || 'N/A'}</div>
          </div>

          <div className="form-group">
            <label><strong>Course Code</strong></label>
            <div>{program.courseCode || 'N/A'}</div>
          </div>

          <div className="form-group">
            <label><strong>Course Name</strong></label>
            <div>{program.courseName || program.programName || 'N/A'}</div>
          </div>

          <div className="form-group">
            <label><strong>Technology</strong></label>
            <div>{program.technology || program.technologyOther || 'N/A'}</div>
          </div>

          <div className="form-group">
            <label><strong>Number of Participants</strong></label>
            <div>{program.numberOfParticipants || 'N/A'}</div>
          </div>

          <div className="form-group">
            <label><strong>Attendance</strong></label>
            <div>{program.attendance !== undefined && program.attendance !== null ? program.attendance : 'N/A'}</div>
          </div>

          <div className="form-group">
            <label><strong>Start Date</strong></label>
            <div>{program.startDate ? new Date(program.startDate).toLocaleDateString() : 'N/A'}</div>
          </div>

          <div className="form-group">
            <label><strong>End Date</strong></label>
            <div>{program.endDate ? new Date(program.endDate).toLocaleDateString() : 'N/A'}</div>
          </div>

          <div className="form-group">
            <label><strong>Number of Days</strong></label>
            <div>{program.numberOfDays || 'N/A'}</div>
          </div>

          <div className="form-group">
            <label><strong>Location</strong></label>
            <div>{program.location || 'N/A'}</div>
          </div>

          {program.location && (program.location === 'Classroom' || program.location === 'Hybrid' || program.location === 'Classroom / Hybrid') && (
            <div className="form-group">
              <label><strong>Training Location</strong></label>
              <div>{program.trainingLocation || 'N/A'}</div>
            </div>
          )}

          <div className="form-group">
            <label><strong>Trainers</strong></label>
            <div>
              {Array.isArray(program.trainers) && program.trainers.length > 0
                ? program.trainers.join(', ')
                : (program.trainers || 'N/A')}
            </div>
          </div>
        </div>
      </div>

      <div className="form-card" style={{ marginTop: '24px' }}>
        <h2>Financial Information</h2>
        
        <div className="form-grid">
          <div className="form-group">
            <label><strong>TOV (Total Order Value)</strong></label>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
              ₹{(program.tov || 0).toLocaleString()}
            </div>
          </div>

          <div className="form-group">
            <label><strong>PO</strong></label>
            <div>{program.po || 'N/A'}</div>
          </div>

          <div className="form-group">
            <label><strong>PO Date</strong></label>
            <div>{program.poDate ? new Date(program.poDate).toLocaleDateString() : 'N/A'}</div>
          </div>

          <div className="form-group">
            <label><strong>Invoice Number</strong></label>
            <div>{program.invoiceNumber || 'N/A'}</div>
          </div>

          <div className="form-group">
            <label><strong>Invoice Date</strong></label>
            <div>{program.invoiceDate ? new Date(program.invoiceDate).toLocaleDateString() : 'N/A'}</div>
          </div>

          <div className="form-group">
            <label><strong>Payment Terms</strong></label>
            <div>{program.paymentTerms || 'N/A'}</div>
          </div>

          <div className="form-group">
            <label><strong>Payment Date</strong></label>
            <div>{program.paymentDate ? new Date(program.paymentDate).toLocaleDateString() : 'N/A'}</div>
          </div>
        </div>
      </div>

      <div className="form-card" style={{ marginTop: '24px' }}>
        <h2>Cost Breakdown</h2>
        
        <div className="form-grid">
          <div className="form-group">
            <label><strong>Trainer PO Values</strong></label>
            <div>₹{(program.trainerPOValues || 0).toLocaleString()}</div>
          </div>

          <div className="form-group">
            <label><strong>Lab PO Value</strong></label>
            <div>₹{(program.labPOValue || 0).toLocaleString()}</div>
          </div>

          <div className="form-group">
            <label><strong>Course Material</strong></label>
            <div>₹{(program.courseMaterial || 0).toLocaleString()}</div>
          </div>

          <div className="form-group">
            <label><strong>Royalty Charges</strong></label>
            <div>₹{(program.royaltyCharges || 0).toLocaleString()}</div>
          </div>

          <div className="form-group">
            <label><strong>Venue</strong></label>
            <div>{program.venue || 'N/A'}</div>
          </div>

          <div className="form-group">
            <label><strong>Travel Charges</strong></label>
            <div>₹{(program.travelCharges || 0).toLocaleString()}</div>
          </div>

          <div className="form-group">
            <label><strong>Accommodation</strong></label>
            <div>₹{(program.accommodation || 0).toLocaleString()}</div>
          </div>

          <div className="form-group">
            <label><strong>Per Diem</strong></label>
            <div>₹{(program.perDiem || 0).toLocaleString()}</div>
          </div>

          <div className="form-group">
            <label><strong>Local Conveyance</strong></label>
            <div>₹{(program.localConveyance || 0).toLocaleString()}</div>
          </div>

          <div className="form-group">
            <label><strong>Marketing Charges</strong></label>
            <div>
              ₹{(program.marketingChargesAmount || 0).toLocaleString()}
              {program.marketingChargesPercent ? ` (${program.marketingChargesPercent}%)` : ''}
            </div>
          </div>

          <div className="form-group">
            <label><strong>Contingency</strong></label>
            <div>
              ₹{(program.contingencyAmount || 0).toLocaleString()}
              {program.contingencyPercent ? ` (${program.contingencyPercent}%)` : ''}
            </div>
          </div>

          <div className="form-group">
            <label><strong>Total Expenses</strong></label>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#dc3545' }}>
              ₹{((program.tov || 0) - (program.finalGP || 0)).toLocaleString()}
            </div>
          </div>

          <div className="form-group">
            <label><strong>Final GP (Gross Profit)</strong></label>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: program.finalGP >= 0 ? '#28a745' : '#dc3545' }}>
              {program.tov && program.tov > 0 
                ? `${((program.finalGP || 0) / program.tov * 100).toFixed(2)}% (₹${(program.finalGP || 0).toLocaleString()})`
                : `₹${(program.finalGP || 0).toLocaleString()}`
              }
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <button
          onClick={() => {
            // Generate and download program report
            window.print();
          }}
          className="btn-primary"
          style={{ marginRight: '10px' }}
        >
          View Report / Print
        </button>
        <button
          onClick={() => navigate('/programs')}
          className="btn-secondary"
        >
          Back to Programs
        </button>
      </div>
    </div>
  );
};

export default ProgramDetail;
