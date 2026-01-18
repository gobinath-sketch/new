import { useState, useEffect } from 'react';
import api from '../services/api';
import './Table.css';

const Materials = ({ user }) => {
  const [materials, setMaterials] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [dropdownOptions, setDropdownOptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    programId: '',
    materialName: '',
    quantityRequired: '',
    materialCost: '',
    courierPartner: '',
    materialStatus: 'Pending'
  });

  useEffect(() => {
    fetchMaterials();
    fetchPrograms();
    fetchDropdownOptions();
  }, []);

  const fetchDropdownOptions = async () => {
    try {
      const response = await api.get('/dropdown-options');
      setDropdownOptions(response.data);
    } catch (error) {
      console.error('Error fetching dropdown options:', error);
    }
  };

  const fetchMaterials = async () => {
    try {
      const response = await api.get('/materials');
      setMaterials(response.data);
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrograms = async () => {
    try {
      const response = await api.get('/programs');
      setPrograms(response.data);
    } catch (error) {
      console.error('Error fetching programs:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/materials', formData);
      setShowForm(false);
      setFormData({
        programId: '',
        materialName: '',
        quantityRequired: '',
        materialCost: '',
        courierPartner: '',
        materialStatus: 'Pending'
      });
      fetchMaterials();
      fetchDropdownOptions();
    } catch (error) {
      console.error('Error creating material:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title">Materials & Logistics</h1>
        {user.role === 'Operations Manager' && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            {showForm ? 'Cancel' : 'Add Material'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="form-card">
          <h2>Add Material</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Program</label>
              <select value={formData.programId} onChange={(e) => setFormData({ ...formData, programId: e.target.value })} required>
                <option value="">Select Program</option>
                {programs.map(program => (
                  <option key={program._id} value={program._id}>{program.programName} - {program.programCode}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Material Name</label>
              <input type="text" value={formData.materialName} onChange={(e) => setFormData({ ...formData, materialName: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Quantity Required</label>
              <input type="number" value={formData.quantityRequired} onChange={(e) => setFormData({ ...formData, quantityRequired: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Material Cost</label>
              <input 
                type="number" 
                value={formData.materialCost} 
                onChange={(e) => setFormData({ ...formData, materialCost: e.target.value })} 
              />
            </div>
            <div className="form-group">
              <label>Courier Partner</label>
              <select 
                value={formData.courierPartner} 
                onChange={(e) => setFormData({ ...formData, courierPartner: e.target.value })}
              >
                <option value="">Select Courier Partner</option>
                {dropdownOptions.courierPartner?.map(partner => (
                  <option key={partner} value={partner}>{partner}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Material Status</label>
              <select 
                value={formData.materialStatus} 
                onChange={(e) => setFormData({ ...formData, materialStatus: e.target.value })}
                required
              >
                <option value="">Select Status</option>
                {dropdownOptions.materialStatus?.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" className="btn-primary">Create Material</button>
        </form>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Program</th>
              <th>Material Name</th>
              <th>Quantity</th>
              <th>Cost</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {materials.map(material => (
              <tr key={material._id}>
                <td>{material.programId?.programName || '-'}</td>
                <td>{material.materialName}</td>
                <td>{material.quantityRequired}</td>
                <td>₹{material.materialCost || 0}</td>
                <td>{material.trackingNumber ? 'Dispatched' : 'Pending'}</td>
                <td>
                  <button 
                    onClick={() => {
                      const details = `
MATERIAL DETAILS

Program: ${material.programId?.programName || 'N/A'}
Material Name: ${material.materialName}
Quantity Required: ${material.quantityRequired}
Material Cost: ₹${material.materialCost || 0}
Courier Partner: ${material.courierPartner || 'N/A'}
Material Status: ${material.materialStatus || 'Pending'}
${material.trackingNumber ? `Tracking Number: ${material.trackingNumber}` : ''}
Created Date: ${new Date(material.createdAt).toLocaleString()}
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
    </div>
  );
};

export default Materials;
