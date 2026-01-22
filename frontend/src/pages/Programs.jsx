import { useState, useEffect } from 'react';
import api from '../services/api';
import './Table.css';

const Programs = ({ user }) => {
  const [programs, setPrograms] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [dropdownOptions, setDropdownOptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [trainers, setTrainers] = useState(['']);
  const [showMarketingPopup, setShowMarketingPopup] = useState(false);
  const [showContingencyPopup, setShowContingencyPopup] = useState(false);
  const [formData, setFormData] = useState({
    trainingOpportunity: '',
    trainingSector: '',
    trainingStatus: 'Scheduled',
    trainingSupporter: '',
    sales: '',
    trainingYear: new Date().getFullYear(),
    trainingMonth: '',
    adhocId: '',
    billingClient: '',
    endClient: '',
    courseCode: '',
    courseName: '',
    technology: '',
    technologyOther: '',
    numberOfParticipants: '',
    attendance: '',
    startDate: '',
    endDate: '',
    numberOfDays: '',
    location: '',
    tov: '',
    po: '',
    poDate: '',
    invoiceNumber: '',
    invoiceDate: '',
    paymentTerms: '',
    paymentDate: '',
    trainerPOValues: '',
    labPOValue: '',
    courseMaterial: '',
    royaltyCharges: '',
    venue: '',
    travelCharges: '',
    accommodation: '',
    perDiem: '',
    localConveyance: '',
    marketingChargesPercent: '',
    marketingChargesAmount: '',
    marketingChargesManual: '',
    contingencyPercent: '',
    contingencyAmount: '',
    contingencyManual: '',
    finalGP: 0
  });

  useEffect(() => {
    fetchPrograms();
    fetchDropdownOptions();
    fetchVendors();
  }, []);

  useEffect(() => {
    calculateGP();
  }, [
    formData.tov, formData.trainerPOValues, formData.labPOValue,
    formData.courseMaterial, formData.royaltyCharges, formData.travelCharges,
    formData.accommodation, formData.perDiem, formData.localConveyance,
    formData.marketingChargesAmount, formData.contingencyAmount
  ]);

  // Removed auto-calculation of numberOfDays - now manual input

  const fetchDropdownOptions = async () => {
    try {
      const response = await api.get('/dropdown-options');
      setDropdownOptions(response.data);
    } catch (error) {
      console.error('Error fetching dropdown options:', error);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await api.get('/vendors');
      const activeVendors = response.data.filter(v =>
        v.status === 'Active' && !v.blacklistFlag
      );
      setVendors(activeVendors);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const fetchPrograms = async () => {
    try {
      const response = await api.get('/programs');
      setPrograms(response.data);
    } catch (error) {
      console.error('Error fetching programs:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateGP = () => {
    const tov = parseFloat(formData.tov) || 0;
    const trainerPO = parseFloat(formData.trainerPOValues) || 0;
    const labPO = parseFloat(formData.labPOValue) || 0;
    const courseMaterial = parseFloat(formData.courseMaterial) || 0;
    const royalty = parseFloat(formData.royaltyCharges) || 0;
    const travel = parseFloat(formData.travelCharges) || 0;
    const accommodation = parseFloat(formData.accommodation) || 0;
    const perDiem = parseFloat(formData.perDiem) || 0;
    const conveyance = parseFloat(formData.localConveyance) || 0;
    const marketing = parseFloat(formData.marketingChargesAmount) || 0;
    const contingency = parseFloat(formData.contingencyAmount) || 0;

    const totalCosts = trainerPO + labPO + courseMaterial + royalty + travel + accommodation + perDiem + conveyance + marketing + contingency;
    const gp = tov - totalCosts;

    setFormData(prev => ({ ...prev, finalGP: gp }));
  };

  const handleMarketingCharges = (percent) => {
    if (percent === 'manual') {
      const manual = parseFloat(formData.marketingChargesManual) || 0;
      setFormData(prev => ({
        ...prev,
        marketingChargesPercent: '',
        marketingChargesAmount: manual
      }));
    } else {
      const pct = parseFloat(percent);
      const amount = (parseFloat(formData.tov) || 0) * (pct / 100);
      setFormData(prev => ({
        ...prev,
        marketingChargesPercent: pct,
        marketingChargesAmount: amount,
        marketingChargesManual: ''
      }));
    }
    setShowMarketingPopup(false);
    calculateGP();
  };

  const handleContingency = (percent) => {
    if (percent === 'manual') {
      const manual = parseFloat(formData.contingencyManual) || 0;
      setFormData(prev => ({
        ...prev,
        contingencyPercent: '',
        contingencyAmount: manual
      }));
    } else {
      const pct = parseFloat(percent);
      const amount = (parseFloat(formData.tov) || 0) * (pct / 100);
      setFormData(prev => ({
        ...prev,
        contingencyPercent: pct,
        contingencyAmount: amount,
        contingencyManual: ''
      }));
    }
    setShowContingencyPopup(false);
    calculateGP();
  };

  const addTrainer = () => {
    setTrainers([...trainers, '']);
  };

  const removeTrainer = (index) => {
    if (trainers.length > 1) {
      const newTrainers = trainers.filter((_, i) => i !== index);
      setTrainers(newTrainers);
    }
  };

  const updateTrainer = (index, value) => {
    const newTrainers = [...trainers];
    newTrainers[index] = value;
    setTrainers(newTrainers);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        technology: formData.technology === 'Other' ? formData.technologyOther : formData.technology,
        trainers: trainers.filter(t => t.trim() !== ''),
        marketingChargesAmount: formData.marketingChargesAmount || 0,
        contingencyAmount: formData.contingencyAmount || 0,
        finalGP: formData.finalGP || 0
      };

      await api.post('/programs', submitData);
      setShowForm(false);
      setTrainers(['']);
      setFormData({
        trainingOpportunity: '',
        trainingSector: '',
        trainingStatus: 'Scheduled',
        trainingSupporter: '',
        sales: '',
        trainingYear: new Date().getFullYear(),
        trainingMonth: '',
        adhocId: '',
        billingClient: '',
        endClient: '',
        courseCode: '',
        courseName: '',
        technology: '',
        technologyOther: '',
        numberOfParticipants: '',
        attendance: '',
        startDate: '',
        endDate: '',
        numberOfDays: '',
        location: '',
        trainingLocation: '',
        tov: '',
        po: '',
        poDate: '',
        invoiceNumber: '',
        invoiceDate: '',
        paymentTerms: '',
        paymentDate: '',
        trainerPOValues: '',
        labPOValue: '',
        courseMaterialRoyaltyCharges: '',
        venue: '',
        trainingCharges: '',
        accommodation: '',
        perDiem: '',
        localConveyance: '',
        marketingChargesPercent: '',
        marketingChargesAmount: '',
        marketingChargesManual: '',
        contingencyPercent: '',
        contingencyAmount: '',
        contingencyManual: '',
        finalGP: 0
      });
      fetchPrograms();
      fetchDropdownOptions();
    } catch (error) {
      console.error('Error creating program:', error);
      alert(error.response?.data?.error || 'Error creating program');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title">Programs & Batches</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancel' : 'Add Program'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="form-card">
          <h2>Add Program</h2>

          <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px', color: '#333' }}>Program Details</h3>
          <div className="form-grid">
            {/* Adhoc ID */}
            <div className="form-group">
              <label>Adhoc ID</label>
              <input
                type="text"
                value={formData.adhocId}
                onChange={(e) => setFormData({ ...formData, adhocId: e.target.value })}
              />
            </div>
            {/* Training Opportunities */}
            <div className="form-group">
              <label>Training Opportunities</label>
              <select
                value={formData.trainingOpportunity}
                onChange={(e) => setFormData({ ...formData, trainingOpportunity: e.target.value })}
                required
              >
                <option value="">Select Training Opportunity</option>
                {dropdownOptions.trainingOpportunity?.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Training Sectors */}
            <div className="form-group">
              <label>Training Sectors</label>
              <select
                value={formData.trainingSector}
                onChange={(e) => setFormData({ ...formData, trainingSector: e.target.value })}
                required
              >
                <option value="">Select Training Sector</option>
                {dropdownOptions.trainingSector?.map(sector => (
                  <option key={sector} value={sector}>{sector}</option>
                ))}
              </select>
            </div>

            {/* Training Status */}
            <div className="form-group">
              <label>Training Status</label>
              <select
                value={formData.trainingStatus}
                onChange={(e) => setFormData({ ...formData, trainingStatus: e.target.value })}
                required
              >
                {dropdownOptions.trainingStatus?.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {/* Training Supporter */}
            <div className="form-group">
              <label>Training Supporter</label>
              <select
                value={formData.trainingSupporter}
                onChange={(e) => setFormData({ ...formData, trainingSupporter: e.target.value })}
                required
              >
                <option value="">Select Training Supporter</option>
                {dropdownOptions.trainingSupporter?.map(supporter => (
                  <option key={supporter} value={supporter}>{supporter}</option>
                ))}
              </select>
            </div>

            {/* Sales */}
            <div className="form-group">
              <label>Sales</label>
              <input
                type="text"
                value={formData.sales}
                onChange={(e) => setFormData({ ...formData, sales: e.target.value })}
              />
            </div>

            {/* Training Year */}
            <div className="form-group">
              <label>Training Year</label>
              <input
                type="number"
                value={formData.trainingYear}
                onChange={(e) => setFormData({ ...formData, trainingYear: e.target.value })}
                required
                min="2020"
                max="2100"
              />
            </div>

            {/* Training Month */}
            <div className="form-group">
              <label>Training Month</label>
              <select
                value={formData.trainingMonth}
                onChange={(e) => setFormData({ ...formData, trainingMonth: e.target.value })}
                required
              >
                <option value="">Select Month</option>
                {dropdownOptions.trainingMonth?.map(month => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
            </div>



            {/* Billing Client */}
            <div className="form-group">
              <label>Billing Client Name</label>
              <input
                type="text"
                value={formData.billingClient}
                onChange={(e) => setFormData({ ...formData, billingClient: e.target.value })}
                required
              />
            </div>

            {/* End Client */}
            <div className="form-group">
              <label>End Client Name</label>
              <input
                type="text"
                value={formData.endClient}
                onChange={(e) => setFormData({ ...formData, endClient: e.target.value })}
                required
              />
            </div>

            {/* Course Code */}
            <div className="form-group">
              <label>Course Code</label>
              <input
                type="text"
                value={formData.courseCode}
                onChange={(e) => setFormData({ ...formData, courseCode: e.target.value })}
                required
              />
            </div>

            {/* Course Name */}
            <div className="form-group">
              <label>Course Name</label>
              <input
                type="text"
                value={formData.courseName}
                onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                required
              />
            </div>

            {/* Technology */}
            <div className="form-group">
              <label>Technology</label>
              <select
                value={formData.technology}
                onChange={(e) => setFormData({ ...formData, technology: e.target.value, technologyOther: '' })}
                required
              >
                <option value="">Select Technology</option>
                {dropdownOptions.technology?.map(tech => (
                  <option key={tech} value={tech}>{tech}</option>
                ))}
                <option value="Other">Other</option>
              </select>
              {formData.technology === 'Other' && (
                <input
                  type="text"
                  value={formData.technologyOther}
                  onChange={(e) => setFormData({ ...formData, technologyOther: e.target.value })}
                  placeholder="Enter technology name"
                  required
                  style={{ marginTop: '8px' }}
                />
              )}
            </div>

            {/* Number of Participants */}
            <div className="form-group">
              <label>Number of Participants</label>
              <input
                type="number"
                value={formData.numberOfParticipants}
                onChange={(e) => setFormData({ ...formData, numberOfParticipants: e.target.value })}
                required
                min="1"
              />
            </div>

            {/* Attendance */}
            <div className="form-group">
              <label>Attendance</label>
              <input
                type="number"
                value={formData.attendance}
                onChange={(e) => setFormData({ ...formData, attendance: e.target.value })}
                min="0"
              />
            </div>

            {/* Start Date */}
            <div className="form-group">
              <label>Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>

            {/* End Date */}
            <div className="form-group">
              <label>End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
                min={formData.startDate}
              />
            </div>

            {/* Number of Days */}
            <div className="form-group">
              <label>Number of Days</label>
              <input
                type="number"
                value={formData.numberOfDays}
                onChange={(e) => setFormData({ ...formData, numberOfDays: e.target.value })}
                placeholder="Enter number of days manually"
                required
                min="1"
                step="1"
              />
            </div>

            {/* Location */}
            <div className="form-group">
              <label>Location</label>
              <select
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              >
                <option value="">Select Location</option>
                {dropdownOptions.location?.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* Training Location (if Classroom/Hybrid/Classroom / Hybrid) */}
            {(formData.location === 'Classroom' || formData.location === 'Hybrid' || formData.location === 'Classroom / Hybrid') && (
              <div className="form-group">
                <label>Training Location</label>
                <input
                  type="text"
                  value={formData.trainingLocation || ''}
                  onChange={(e) => setFormData({ ...formData, trainingLocation: e.target.value })}
                  placeholder="Enter training location address"
                  required
                />
              </div>
            )}

            {/* Trainer */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Trainer(s)</label>
              {trainers.map((trainer, index) => (
                <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                  <select
                    value={trainer}
                    onChange={(e) => updateTrainer(index, e.target.value)}
                    required={index === 0}
                    style={{ flex: 1 }}
                  >
                    <option value="">Select Trainer {index + 1}</option>
                    {vendors.map(vendor => (
                      <option key={vendor._id} value={vendor.vendorName}>{vendor.vendorName}</option>
                    ))}
                  </select>
                  {trainers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTrainer(index)}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addTrainer}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginTop: '8px'
                }}
              >
                + Add Trainer
              </button>
            </div>

            {/* TOV (Billing Amount) */}
            <div className="form-group">
              <label>TOV (Billing Amount)</label>
              <input
                type="number"
                value={formData.tov}
                onChange={(e) => setFormData({ ...formData, tov: e.target.value })}
                required
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px', marginTop: '30px', color: '#333' }}>Expenses</h3>
          <div className="form-grid">
            {/* Client PO Number */}
            <div className="form-group">
              <label>Client PO Number</label>
              <input
                type="text"
                value={formData.po}
                onChange={(e) => setFormData({ ...formData, po: e.target.value })}
              />
            </div>

            {/* Client PO Date */}
            <div className="form-group">
              <label>Client PO Date</label>
              <input
                type="date"
                value={formData.poDate}
                onChange={(e) => setFormData({ ...formData, poDate: e.target.value })}
              />
            </div>

            {/* Client Invoice Number */}
            <div className="form-group">
              <label>Client Invoice Number</label>
              <input
                type="text"
                value={formData.invoiceNumber}
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
              />
            </div>

            {/* Client Invoice Date */}
            <div className="form-group">
              <label>Client Invoice Date</label>
              <input
                type="date"
                value={formData.invoiceDate}
                onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
              />
            </div>





            {/* Trainer PO Cost */}
            <div className="form-group">
              <label>Trainer Cost</label>
              <input
                type="number"
                value={formData.trainerPOValues}
                onChange={(e) => setFormData({ ...formData, trainerPOValues: e.target.value })}
                min="0"
                step="0.01"
              />
            </div>

            {/* Lab PO Cost */}
            <div className="form-group">
              <label>Lab Cost</label>
              <input
                type="number"
                value={formData.labPOValue}
                onChange={(e) => setFormData({ ...formData, labPOValue: e.target.value })}
                min="0"
                step="0.01"
              />
            </div>

            {/* Course Material Cost */}
            <div className="form-group">
              <label>Course Material Cost</label>
              <input
                type="number"
                value={formData.courseMaterial}
                onChange={(e) => setFormData({ ...formData, courseMaterial: e.target.value })}
                min="0"
                step="0.01"
              />
            </div>

            {/* Royalty Charges */}
            <div className="form-group">
              <label>Royalty Charges</label>
              <input
                type="number"
                value={formData.royaltyCharges}
                onChange={(e) => setFormData({ ...formData, royaltyCharges: e.target.value })}
                min="0"
                step="0.01"
              />
            </div>

            {/* Venue Cost */}
            <div className="form-group">
              <label>Venue Cost</label>
              <input
                type="text"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              />
            </div>

            {/* Travel Charges */}
            <div className="form-group">
              <label>Travel Charges</label>
              <input
                type="number"
                value={formData.travelCharges}
                onChange={(e) => setFormData({ ...formData, travelCharges: e.target.value })}
                min="0"
                step="0.01"
              />
            </div>

            {/* Accommodation Cost */}
            <div className="form-group">
              <label>Accommodation Cost</label>
              <input
                type="number"
                value={formData.accommodation}
                onChange={(e) => setFormData({ ...formData, accommodation: e.target.value })}
                min="0"
                step="0.01"
              />
            </div>

            {/* Per Diem */}
            <div className="form-group">
              <label>Per Diem</label>
              <input
                type="number"
                value={formData.perDiem}
                onChange={(e) => setFormData({ ...formData, perDiem: e.target.value })}
                min="0"
                step="0.01"
              />
            </div>

            {/* Local Conveyance */}
            <div className="form-group">
              <label>Local Conveyance</label>
              <input
                type="number"
                value={formData.localConveyance}
                onChange={(e) => setFormData({ ...formData, localConveyance: e.target.value })}
                min="0"
                step="0.01"
              />
            </div>

            {/* Marketing Charges */}
            <div className="form-group">
              <label>Marketing Charges</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="number"
                  value={formData.marketingChargesAmount || ''}
                  readOnly
                  placeholder="Calculated"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => setShowMarketingPopup(true)}
                  className="btn-small btn-primary"
                >
                  Set %
                </button>
              </div>
              {showMarketingPopup && (
                <>
                  <div className="popup-overlay" onClick={() => setShowMarketingPopup(false)} />
                  <div className="popup-container">
                    <div className="popup-header">
                      <h3 className="popup-title">Select Marketing Charges %</h3>
                    </div>
                    <div className="popup-body">
                      <div className="popup-button-group">
                        {dropdownOptions.marketingChargesPercent?.map(pct => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => handleMarketingCharges(pct)}
                            className="popup-option-button"
                          >
                            {pct}%
                          </button>
                        ))}
                        <div className="popup-input-group">
                          <input
                            type="number"
                            placeholder="Manual Amount"
                            value={formData.marketingChargesManual}
                            onChange={(e) => setFormData({ ...formData, marketingChargesManual: e.target.value })}
                          />
                          <button
                            type="button"
                            onClick={() => handleMarketingCharges('manual')}
                            className="btn-success"
                            style={{ width: '100%' }}
                          >
                            Set Manual Amount
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="popup-actions">
                      <button
                        type="button"
                        onClick={() => setShowMarketingPopup(false)}
                        className="btn-danger"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Contingency */}
            <div className="form-group">
              <label>Contingency</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="number"
                  value={formData.contingencyAmount || ''}
                  readOnly
                  placeholder="Calculated"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => setShowContingencyPopup(true)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Set %
                </button>
              </div>
              {showContingencyPopup && (
                <>
                  <div className="popup-overlay" onClick={() => setShowContingencyPopup(false)} />
                  <div className="popup-container">
                    <div className="popup-header">
                      <h3 className="popup-title">Select Contingency %</h3>
                    </div>
                    <div className="popup-body">
                      <div className="popup-button-group">
                        {dropdownOptions.contingencyPercent?.map(pct => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => handleContingency(pct)}
                            className="popup-option-button"
                          >
                            {pct}%
                          </button>
                        ))}
                        <div className="popup-input-group">
                          <input
                            type="number"
                            placeholder="Manual Amount"
                            value={formData.contingencyManual}
                            onChange={(e) => setFormData({ ...formData, contingencyManual: e.target.value })}
                          />
                          <button
                            type="button"
                            onClick={() => handleContingency('manual')}
                            className="btn-success"
                            style={{ width: '100%' }}
                          >
                            Set Manual Amount
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="popup-actions">
                      <button
                        type="button"
                        onClick={() => setShowContingencyPopup(false)}
                        className="btn-danger"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
            {/* Final GP */}
            <div className="form-group">
              <label>Final GP (Gross Profit)</label>
              <input
                type="text"
                value={formData.tov && formData.tov > 0
                  ? `${((formData.finalGP || 0) / formData.tov * 100).toFixed(2)}% (₹${(formData.finalGP || 0).toFixed(2)})`
                  : `₹${(formData.finalGP || 0).toFixed(2)}`
                }
                readOnly
                className="display-field strong"
              />
            </div>
          </div>

          <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px', marginTop: '30px', color: '#333' }}>Attachments</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Attendance Upload</label>
              <input type="file" className="file-input" multiple />
            </div>
            <div className="form-group">
              <label>Feedback Upload</label>
              <input type="file" className="file-input" multiple />
            </div>
            <div className="form-group">
              <label>Assessment Upload</label>
              <input type="file" className="file-input" multiple />
            </div>
          </div>
          <button type="submit" className="btn-primary">Create Program</button>
        </form>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Course Code</th>
              <th>Course Name</th>
              <th>End Client</th>
              <th>Start Date</th>
              <th>Status</th>
              <th>Final GP</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {programs.map(program => (
              <tr key={program._id}>
                <td>{program.courseCode || program.programCode}</td>
                <td>{program.courseName || program.programName}</td>
                <td>{program.endClient || program.clientName}</td>
                <td>{new Date(program.startDate).toLocaleDateString()}</td>
                <td><span className={`status-badge ${(program.trainingStatus || program.deliveryStatus || '').toLowerCase().replace(' ', '-')}`}>
                  {program.trainingStatus || program.deliveryStatus}
                </span></td>
                <td>
                  {program.tov && program.tov > 0
                    ? `${((program.finalGP || 0) / program.tov * 100).toFixed(2)}% (₹${(program.finalGP || 0).toFixed(2)})`
                    : `₹${(program.finalGP || 0).toFixed(2)}`
                  }
                </td>
                <td>
                  <button
                    onClick={() => window.location.href = `/programs/${program._id}`}
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
    </div>
  );
};

export default Programs;
