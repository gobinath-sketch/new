import { useState, useEffect } from 'react';
import api from '../services/api';
import './Table.css';
import VendorForm from '../components/VendorForm';

const Vendors = ({ user, embedded = false, onVendorCreated }) => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(embedded ? true : false);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await api.get('/vendors');
      setVendors(response.data);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVendorCreated = (createdVendor) => {
    if (!embedded) {
      setShowForm(false);
    }
    fetchVendors();
    if (onVendorCreated) {
      onVendorCreated(createdVendor);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {!embedded && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 className="page-title">Vendors</h1>
          {user.role === 'Operations Manager' && (
            <button onClick={() => setShowForm(!showForm)} className="btn-primary">
              {showForm ? 'Cancel' : 'Add Vendor'}
            </button>
          )}
        </div>
      )}

      {(showForm || embedded) && user.role === 'Operations Manager' && (
        <VendorForm
          user={user}
          onSuccess={handleVendorCreated}
          onCancel={() => setShowForm(false)}
        />
      )}

      {!embedded && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Vendor Name</th>
                <th>Type</th>
                <th>Contact Person</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map(vendor => (
                <tr key={vendor._id}>
                  <td>{vendor.vendorName}</td>
                  <td>{vendor.vendorType}</td>
                  <td>
                    {Array.isArray(vendor.contactPersonName)
                      ? vendor.contactPersonName.join(', ')
                      : vendor.contactPersonName}
                  </td>
                  <td>
                    {Array.isArray(vendor.phone)
                      ? vendor.phone.join(', ')
                      : vendor.phone}
                  </td>
                  <td><span className={`status-badge ${vendor.status.toLowerCase().replace(' ', '-')}`}>{vendor.status}</span></td>
                  <td>
                    <button
                      onClick={() => {
                        const details = `
VENDOR DETAILS

Name: ${vendor.vendorName}
Type: ${vendor.vendorType}
Address: ${vendor.address}
Contact Person(s): ${Array.isArray(vendor.contactPersonName) ? vendor.contactPersonName.join(', ') : vendor.contactPersonName}
Phone(s): ${Array.isArray(vendor.phone) ? vendor.phone.join(', ') : vendor.phone}
Email: ${vendor.email}
PAN: ${vendor.panNumber}
GST: ${vendor.gstNumber || 'N/A'}
Bank: ${vendor.bankName}
Account: ${vendor.bankAccountNumber}
IFSC: ${vendor.ifscCode}
Status: ${vendor.status}
                        `;
                        alert(details);
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
      )}
    </div>
  );
};

export default Vendors;
