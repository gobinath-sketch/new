import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Table.css';
import { useModal } from '../contexts/context/ModalContext.jsx';

const ClientDetail = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const modal = useModal();

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const response = await api.get(`/clients/${id}`);
        setClient(response.data);
      } catch (error) {
        console.error('Error fetching client:', error);
        modal.alert({
          title: 'Error',
          message: 'Error loading client details',
          okText: 'Close',
          type: 'danger'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [id]);

  if (loading) return <div className="loading">Loading client details...</div>;
  if (!client) return <div className="error">Client not found</div>;

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title">Client Details</h1>
        <button 
          onClick={() => navigate('/')} 
          className="btn-secondary"
          style={{ 
            fontSize: '20px', 
            width: '40px', 
            height: '40px', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: 0,
            cursor: 'pointer',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none'
          }}
          title="Close and return to Dashboard"
        >
          ×
        </button>
      </div>

      <div className="form-card">
        <h2 style={{ marginBottom: '24px', color: '#333' }}>Client Information</h2>
        
        <div className="form-grid">
          <div className="form-group">
            <label><strong>Client Name</strong></label>
            <div style={{ padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              {client.clientName}
            </div>
          </div>

          <div className="form-group">
            <label><strong>Training Sector</strong></label>
            <div style={{ padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              {client.trainingSector}
            </div>
          </div>

          <div className="form-group">
            <label><strong>Contact Person</strong></label>
            <div style={{ padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              {Array.isArray(client.contactPersonName) ? client.contactPersonName.join(', ') : client.contactPersonName}
            </div>
          </div>

          <div className="form-group">
            <label><strong>Designation</strong></label>
            <div style={{ padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              {client.designation || 'N/A'}
            </div>
          </div>

          <div className="form-group">
            <label><strong>Contact Number</strong></label>
            <div style={{ padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              {client.contactNumber}
            </div>
          </div>

          <div className="form-group">
            <label><strong>Email ID</strong></label>
            <div style={{ padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              {client.emailId}
            </div>
          </div>

          <div className="form-group">
            <label><strong>Location</strong></label>
            <div style={{ padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              {client.location}
            </div>
          </div>
        </div>

        {client.hasReportingManager && (
          <>
            <h3 style={{ marginTop: '32px', marginBottom: '16px', color: '#333' }}>Reporting Manager Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label><strong>Reporting Manager Designation</strong></label>
                <div style={{ padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                  {client.reportingManagerDesignation || 'N/A'}
                </div>
              </div>

              <div className="form-group">
                <label><strong>Reporting Manager Contact Number</strong></label>
                <div style={{ padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                  {client.reportingManagerContactNumber || 'N/A'}
                </div>
              </div>

              <div className="form-group">
                <label><strong>Reporting Manager Email ID</strong></label>
                <div style={{ padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                  {client.reportingManagerEmailId || 'N/A'}
                </div>
              </div>

              <div className="form-group">
                <label><strong>Reporting Manager Location</strong></label>
                <div style={{ padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                  {client.reportingManagerLocation || 'N/A'}
                </div>
              </div>
            </div>
          </>
        )}

        <div style={{ marginTop: '32px', padding: '16px', backgroundColor: '#e9ecef', borderRadius: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <strong>Created By:</strong> {client.createdBy?.name || 'N/A'} ({client.createdBy?.email || 'N/A'})
            </div>
            <div>
              <strong>Created Date:</strong> {new Date(client.createdAt).toLocaleString()}
            </div>
            <div>
              <strong>Last Updated:</strong> {new Date(client.updatedAt).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetail;
