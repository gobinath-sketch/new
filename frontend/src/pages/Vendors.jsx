import { useState, useEffect } from 'react';
import api from '../services/api';
import './Table.css';
import VendorForm from '../components/VendorForm.jsx';
import { useModal } from '../contexts/context/ModalContext.jsx';

const Vendors = ({ user, embedded = false, onVendorCreated }) => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(embedded ? true : false);
  const modal = useModal();

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
        <div className="page-header">
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
                        const contactPersons = Array.isArray(vendor.contactPersonName)
                          ? vendor.contactPersonName.join(', ')
                          : vendor.contactPersonName;

                        const phones = Array.isArray(vendor.phone)
                          ? vendor.phone.join(', ')
                          : vendor.phone;

                        modal.alert({
                          title: 'Vendor Details',
                          okText: 'Close',
                          type: 'info',
                          containerClassName: 'modal-wide',
                          message: (
                            <div className="modal-scroll-area">
                              <h4 className="modal-section-title">Basic Information</h4>
                              <div className="modal-kv-grid">
                                <div className="modal-kv-label">Vendor Name</div>
                                <div className="modal-kv-value">{vendor.vendorName || 'N/A'}</div>

                                <div className="modal-kv-label">Type</div>
                                <div className="modal-kv-value">{vendor.vendorType || 'N/A'}</div>

                                <div className="modal-kv-label">Status</div>
                                <div className="modal-kv-value">
                                  <span className={`status-badge ${(vendor.status || 'Active').toLowerCase().replace(' ', '-')}`}>{vendor.status || 'N/A'}</span>
                                </div>
                              </div>

                              <div style={{ height: '16px' }} />

                              <h4 className="modal-section-title">Contact</h4>
                              <div className="modal-kv-grid">
                                <div className="modal-kv-label">Contact Person(s)</div>
                                <div className="modal-kv-value">{contactPersons || 'N/A'}</div>

                                <div className="modal-kv-label">Phone(s)</div>
                                <div className="modal-kv-value">{phones || 'N/A'}</div>

                                <div className="modal-kv-label">Email</div>
                                <div className="modal-kv-value">{vendor.email || 'N/A'}</div>
                              </div>

                              <div style={{ height: '16px' }} />

                              <h4 className="modal-section-title">Address</h4>
                              <div className="modal-kv-grid">
                                <div className="modal-kv-label">Address</div>
                                <div className="modal-kv-value">{vendor.address || 'N/A'}</div>
                              </div>

                              <div style={{ height: '16px' }} />

                              <h4 className="modal-section-title">Tax & Banking</h4>
                              <div className="modal-kv-grid">
                                <div className="modal-kv-label">PAN</div>
                                <div className="modal-kv-value">{vendor.panNumber || 'N/A'}</div>

                                <div className="modal-kv-label">GST</div>
                                <div className="modal-kv-value">{vendor.gstNumber || 'N/A'}</div>

                                <div className="modal-kv-label">Bank Name</div>
                                <div className="modal-kv-value">{vendor.bankName || 'N/A'}</div>

                                <div className="modal-kv-label">Account No.</div>
                                <div className="modal-kv-value">{vendor.bankAccountNumber || 'N/A'}</div>

                                <div className="modal-kv-label">IFSC</div>
                                <div className="modal-kv-value">{vendor.ifscCode || 'N/A'}</div>
                              </div>
                            </div>
                          )
                        });
                      }}
                      className="btn-small btn-primary"
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
