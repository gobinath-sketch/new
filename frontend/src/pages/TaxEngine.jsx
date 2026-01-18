import { useState, useEffect } from 'react';
import api from '../services/api';
import './Table.css';

const TaxEngine = ({ user }) => {
  const [taxRecords, setTaxRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTaxRecords();
  }, []);

  const fetchTaxRecords = async () => {
    try {
      const response = await api.get('/tax-engine');
      setTaxRecords(response.data);
    } catch (error) {
      console.error('Error fetching tax records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOverride = async (id, reason) => {
    try {
      await api.put(`/tax-engine/${id}/override`, { reason });
      fetchTaxRecords();
    } catch (error) {
      console.error('Error overriding:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="page-title">Tax Engine - TDS Management</h1>
      
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Vendor</th>
              <th>Payment Amount</th>
              <th>TDS Section</th>
              <th>TDS %</th>
              <th>TDS Amount</th>
              <th>Net Payable</th>
              <th>PAN Status</th>
              <th>Compliance</th>
              {user.role === 'Director' && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {taxRecords.map(record => (
              <tr key={record._id}>
                <td>{record.vendorId?.vendorName || '-'}</td>
                <td>₹{record.paymentAmount.toLocaleString()}</td>
                <td>{record.tdsSection}</td>
                <td>{record.applicableTdsPercent}%</td>
                <td>₹{record.tdsAmount.toLocaleString()}</td>
                <td>₹{record.netPayableAmount.toLocaleString()}</td>
                <td>{record.panAvailabilityFlag ? '✓' : '✗'}</td>
                <td><span className={`status-badge ${record.complianceStatus.toLowerCase().replace(' ', '-')}`}>{record.complianceStatus}</span></td>
                {user.role === 'Director' && record.complianceStatus === 'Pending PAN' && !record.directorOverrideFlag && (
                  <td>
                    <button 
                      onClick={() => {
                        const reason = prompt('Enter override reason:');
                        if (reason) handleOverride(record._id, reason);
                      }} 
                      className="btn-small"
                    >
                      Override
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TaxEngine;
