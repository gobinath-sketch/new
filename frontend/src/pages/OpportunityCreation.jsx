import { useState, useEffect } from 'react';
import api from '../services/api';
import './Table.css';
import ClientCreation from './ClientCreation';
import { useModal } from '../contexts/context/ModalContext.jsx';

const ComboField = ({ label, value, onChange, options = [], required, placeholder }) => {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const [inputValue, setInputValue] = useState(value || '');
  useEffect(() => { setInputValue(value || ''); }, [value]);
  const list = (inputValue ? options.filter(o => o && o.toLowerCase().includes(inputValue.toLowerCase())) : options);
  const selectValue = (val) => { onChange(val); setOpen(false); setHighlight(-1); };
  const onKeyDown = (e) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) setOpen(true);
    if (e.key === 'ArrowDown') setHighlight(h => Math.min(h + 1, list.length - 1));
    else if (e.key === 'ArrowUp') setHighlight(h => Math.max(h - 1, 0));
    else if (e.key === 'Enter') {
      if (open && list.length && highlight >= 0) selectValue(list[highlight]);
      else selectValue(inputValue);
    } else if (e.key === 'Escape') { setOpen(false); setHighlight(-1); }
  };
  return (
    <div className="form-group">
      <label>{label}</label>
      <div className="combo">
        <input
          className="combo-input"
          value={inputValue}
          onChange={(e) => { setInputValue(e.target.value); onChange(e.target.value); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 100)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          required={required}
        />
        {open && list && list.length > 0 && (
          <div className="combo-list">
            {list.map((opt, idx) => (
              <div
                key={opt}
                className={`combo-item${idx === highlight ? ' active' : ''}`}
                onMouseDown={() => selectValue(opt)}
                onMouseEnter={() => setHighlight(idx)}
              >
                {opt}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const OpportunityCreation = ({ user }) => {
  const [opportunities, setOpportunities] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [clients, setClients] = useState([]);
  const [dropdownOptions, setDropdownOptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [createdOpportunityId, setCreatedOpportunityId] = useState(null);
  const [trainers, setTrainers] = useState(['']);
  const [showMarketingPopup, setShowMarketingPopup] = useState(false);
  const [showContingencyPopup, setShowContingencyPopup] = useState(false);
  const [clientSelectionMode, setClientSelectionMode] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const modal = useModal();
  const [formData, setFormData] = useState({
    trainingOpportunity: '',
    trainingOpportunityOther: '',
    trainingSector: '',
    trainingSectorOther: '',
    trainingStatus: 'Scheduled',
    trainingSupporter: '',
    trainingSupporterOther: '',
    sales: '',
    trainingYear: new Date().getFullYear(),
    trainingMonth: '',
    adhocId: '',
    billingClient: '',
    endClient: '',
    endClientOther: '',
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
    finalGP: 0,
    // Vouchers fields
    examDetails: '',
    noOfVouchers: '',
    examLocation: '',
    examRegions: [],
    // Resource Support fields
    requirement: '',
    noOfIds: '',
    duration: '',
    region: ''
  });

  useEffect(() => {
    fetchOpportunities();
    fetchDropdownOptions();
    fetchVendors();
    fetchClients();
  }, []);

  useEffect(() => {
    calculateGP();
  }, [
    formData.tov, formData.trainerPOValues, formData.labPOValue,
    formData.courseMaterial, formData.royaltyCharges, formData.travelCharges,
    formData.accommodation, formData.perDiem, formData.localConveyance,
    formData.marketingChargesAmount, formData.contingencyAmount,
    formData.paymentTerms
  ]);

  const fetchDropdownOptions = async () => {
    try {
      const response = await api.get('/dropdown-options');
      const data = response.data || {};
      const mapped = {
        ...data,
        trainingSector: (data.trainingSector || []).map(s => (String(s).toLowerCase() === 'corporate' ? 'Enterprise' : s))
      };
      setDropdownOptions(mapped);
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

  const fetchClients = async () => {
    try {
      const response = await api.get('/clients');
      setClients(response.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchOpportunities = async () => {
    try {
      const response = await api.get('/opportunities');
      setOpportunities(response.data);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
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

    // Validation for Vouchers
    if (formData.trainingOpportunity === 'Vouchers') {
      if (!formData.examRegions || formData.examRegions.length === 0) {
        modal.alert({
          title: 'Validation',
          message: 'Please add at least one exam region with number of exams.',
          okText: 'Close',
          type: 'warning'
        });
        return;
      }
      const invalidRegion = formData.examRegions.find(r => !r.region || !r.numberOfExams);
      if (invalidRegion) {
        modal.alert({
          title: 'Validation',
          message: 'Please fill in all exam region details (region and number of exams).',
          okText: 'Close',
          type: 'warning'
        });
        return;
      }
    }

    try {
      const submitData = {
        ...formData,
        technology: formData.technology === 'Other' ? formData.technologyOther : formData.technology,
        trainingOpportunity: formData.trainingOpportunity === 'Other' ? formData.trainingOpportunityOther : formData.trainingOpportunity,
        trainingSector: formData.trainingSector === 'Other' ? formData.trainingSectorOther : formData.trainingSector,
        trainingSupporter: formData.trainingSupporter === 'Other' ? formData.trainingSupporterOther : formData.trainingSupporter,
        endClient: formData.endClient === 'Other' ? formData.endClientOther : formData.endClient,
        trainers: trainers.filter(t => t.trim() !== ''),
        marketingChargesAmount: formData.marketingChargesAmount || 0,
        contingencyAmount: formData.contingencyAmount || 0,
        finalGP: formData.finalGP || 0,
        expectedStartDate: formData.startDate,
        expectedEndDate: formData.endDate,
        expectedDuration: formData.numberOfDays,
        expectedParticipants: formData.numberOfParticipants,
        expectedCommercialValue: formData.tov,
        opportunityType: formData.trainingOpportunity,
        serviceCategory: formData.trainingSector
      };

      const response = await api.post('/opportunities', submitData);
      const newOpportunityId = response.data.opportunityId;
      setCreatedOpportunityId(newOpportunityId);
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
        finalGP: 0,
        examDetails: '',
        noOfVouchers: '',
        examLocation: '',
        examRegions: [],
        requirement: '',
        noOfIds: '',
        duration: '',
        region: ''
      });
      fetchOpportunities();
      fetchDropdownOptions();
    } catch (error) {
      console.error('Error creating opportunity:', error);
      modal.alert({
        title: 'Error',
        message: error.response?.data?.error || 'Error creating opportunity',
        okText: 'Close',
        type: 'danger'
      });
    }
  };

  if (loading) return <div>Loading...</div>;

  const handleExistingClientChange = (e) => {
    const id = e.target.value;
    setSelectedClientId(id);
    const client = clients.find(c => c._id === id);
    if (client) {
      setFormData(prev => ({
        ...prev,
        billingClient: client.clientName,
        endClient: client.clientName
      }));
    }
  };

  const handleEmbeddedClientCreated = (client) => {
    fetchClients();
    if (client && client._id && client.clientName) {
      setClientSelectionMode('existing');
      setSelectedClientId(client._id);
      setFormData(prev => ({
        ...prev,
        billingClient: client.clientName,
        endClient: client.clientName
      }));
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title">Opportunity Creation</h1>
        <button onClick={() => { setShowForm(!showForm); setCreatedOpportunityId(null); }} className="btn-primary">
          {showForm ? 'Cancel' : 'Create Opportunity'}
        </button>
      </div>

      {createdOpportunityId && (
        <div style={{
          padding: '16px',
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: '4px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <strong style={{ color: '#155724', fontSize: '16px' }}>✓ Opportunity Created Successfully!</strong>
            <div style={{ marginTop: '8px', color: '#155724' }}>
              <strong>Adhoc ID: </strong>
              <span style={{ fontSize: '18px', fontWeight: 'bold', fontFamily: 'monospace' }}>{createdOpportunityId}</span>
            </div>
          </div>
          <button
            onClick={() => setCreatedOpportunityId(null)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="form-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2>Add Opportunity</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setClientSelectionMode(clientSelectionMode === 'existing' ? '' : 'existing')}
              >
                Existing Client
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setClientSelectionMode(clientSelectionMode === 'new' ? '' : 'new')}
              >
                New Client
              </button>
            </div>
          </div>
          {clientSelectionMode === 'existing' && (
            <div style={{ marginBottom: '16px' }}>
              {clients.length === 0 ? (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '4px',
                    backgroundColor: '#fff3cd',
                    border: '1px solid #ffeeba',
                    color: '#856404'
                  }}
                >
                  No existing clients found. Please create a client first.
                </div>
              ) : (
                <div className="form-group" style={{ maxWidth: '400px' }}>
                  <label>Select Existing Client</label>
                  <select value={selectedClientId} onChange={handleExistingClientChange}>
                    <option value="">Select Client</option>
                    {clients.map(client => (
                      <option key={client._id} value={client._id}>
                        {client.clientName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
          {clientSelectionMode === 'new' && (
            <div style={{ marginBottom: '24px' }}>
              <ClientCreation user={user} embedded={true} onClientCreated={handleEmbeddedClientCreated} />
            </div>
          )}

          {/* SECTION 1: Opportunity Details */}
          <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px', color: '#333' }}>Opportunity Details</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Adhoc ID</label>
              <input
                type="text"
                value={formData.adhocId}
                onChange={(e) => setFormData({ ...formData, adhocId: e.target.value })}
              />
            </div>

            <ComboField
              label="Requirements"
              value={formData.trainingOpportunity}
              onChange={(v) => setFormData({ ...formData, trainingOpportunity: v })}
              options={dropdownOptions.trainingOpportunity || []}
              required={true}
              placeholder="Select or type requirement"
            />

            <ComboField
              label="Customer Domain"
              value={formData.trainingSector}
              onChange={(v) => setFormData({ ...formData, trainingSector: v })}
              options={dropdownOptions.trainingSector || []}
              required={true}
              placeholder="Select or type customer domain"
            />

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

            <ComboField
              label="Source"
              value={formData.trainingSupporter}
              onChange={(v) => setFormData({ ...formData, trainingSupporter: v })}
              options={dropdownOptions.trainingSupporter || []}
              required={true}
              placeholder="Select or type source"
            />

            <div className="form-group">
              <label>Sales</label>
              <input
                type="text"
                value={formData.sales}
                onChange={(e) => setFormData({ ...formData, sales: e.target.value })}
              />
            </div>

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

            <div className="form-group">
              <label>Billing Client</label>
              <input
                type="text"
                value={formData.billingClient}
                onChange={(e) => setFormData({ ...formData, billingClient: e.target.value })}
                required
              />
            </div>

            <ComboField
              label="End Client"
              value={formData.endClient}
              onChange={(v) => setFormData({ ...formData, endClient: v })}
              options={clients.map(c => c.clientName)}
              required={true}
              placeholder="Select or type end client"
            />

            <div className="form-group">
              <label>Course Code</label>
              <input
                type="text"
                value={formData.courseCode}
                onChange={(e) => setFormData({ ...formData, courseCode: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Course Name</label>
              <input
                type="text"
                value={formData.courseName}
                onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                placeholder="Enter course name"
                required
              />
            </div>

            <div className="form-group">
              <label>
                Technology
                {(formData.trainingOpportunity === 'Training' || formData.trainingOpportunity === 'Vouchers' || formData.trainingOpportunity === 'Resource Support') && <span style={{ color: 'red' }}> *</span>}
              </label>
              <ComboField
                label=""
                value={formData.technology}
                onChange={(v) => setFormData({ ...formData, technology: v })}
                options={dropdownOptions.technology || []}
                required={formData.trainingOpportunity === 'Training' || formData.trainingOpportunity === 'Vouchers' || formData.trainingOpportunity === 'Resource Support'}
                placeholder="Select or type technology"
              />
            </div>

            {/* Training Specific Fields */}
            {formData.trainingOpportunity === 'Training' && (
              <>


                <div className="form-group">
                  <label>
                    Mode of training
                    <span style={{ color: 'red' }}> *</span>
                  </label>
                  <select
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  >
                    <option value="">Select Mode</option>
                    <option value="Virtual">Virtual</option>
                    <option value="Classroom">Classroom</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    Batch Size
                    <span style={{ color: 'red' }}> *</span>
                  </label>
                  <input
                    type="number"
                    value={formData.numberOfParticipants}
                    onChange={(e) => setFormData({ ...formData, numberOfParticipants: e.target.value })}
                    placeholder="Enter batch size"
                    required
                    min="1"
                    step="1"
                  />
                </div>

                {(formData.location === 'Classroom' || formData.location === 'Hybrid') && (
                  <div className="form-group">
                    <label>
                      Training Location
                      <span style={{ color: 'red' }}> *</span>
                    </label>
                    <input
                      type="text"
                      value={formData.trainingLocation || ''}
                      onChange={(e) => setFormData({ ...formData, trainingLocation: e.target.value })}
                      placeholder="Enter training location address"
                      required
                    />
                  </div>
                )}
              </>
            )}

            {/* Vouchers Specific Fields */}
            {formData.trainingOpportunity === 'Vouchers' && (
              <>
                <div className="form-group">
                  <label>
                    Exam Details
                    <span style={{ color: 'red' }}> *</span>
                  </label>
                  <input
                    type="text"
                    value={formData.examDetails}
                    onChange={(e) => setFormData({ ...formData, examDetails: e.target.value })}
                    placeholder="Enter exam details"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    No of Vouchers
                    <span style={{ color: 'red' }}> *</span>
                  </label>
                  <input
                    type="number"
                    value={formData.noOfVouchers}
                    onChange={(e) => setFormData({ ...formData, noOfVouchers: e.target.value })}
                    placeholder="Enter number of vouchers"
                    required
                    min="1"
                    step="1"
                  />
                </div>

                <div className="form-group">
                  <label>
                    Exam Location
                    <span style={{ color: 'red' }}> *</span>
                  </label>
                  <select
                    value={formData.examLocation}
                    onChange={(e) => setFormData({ ...formData, examLocation: e.target.value })}
                    required
                  >
                    <option value="">Select Exam Location</option>
                    <option value="North">North</option>
                    <option value="South">South</option>
                    <option value="East">East</option>
                    <option value="West">West</option>
                    <option value="Central">Central</option>
                    <option value="Northeast">Northeast</option>
                  </select>
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>
                    Exam Regions & Number of Exams
                    <span style={{ color: 'red' }}> *</span>
                  </label>
                  {((formData.examRegions && formData.examRegions.length > 0) ? formData.examRegions : [{ region: '', numberOfExams: '' }]).map((region, index) => (
                    <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                      <select
                        value={region.region || ''}
                        onChange={(e) => {
                          const currentRegions = (formData.examRegions && formData.examRegions.length > 0) ? formData.examRegions : [{ region: '', numberOfExams: '' }];
                          const newRegions = [...currentRegions];
                          newRegions[index] = { ...newRegions[index], region: e.target.value };
                          setFormData({ ...formData, examRegions: newRegions });
                        }}
                        required
                        style={{ flex: 1 }}
                      >
                        <option value="">Select Region {index + 1}</option>
                        <option value="North">North</option>
                        <option value="South">South</option>
                        <option value="East">East</option>
                        <option value="West">West</option>
                        <option value="Central">Central</option>
                        <option value="Northeast">Northeast</option>
                      </select>
                      <input
                        type="number"
                        value={region.numberOfExams || ''}
                        onChange={(e) => {
                          const currentRegions = (formData.examRegions && formData.examRegions.length > 0) ? formData.examRegions : [{ region: '', numberOfExams: '' }];
                          const newRegions = [...currentRegions];
                          newRegions[index] = { ...newRegions[index], numberOfExams: e.target.value };
                          setFormData({ ...formData, examRegions: newRegions });
                        }}
                        placeholder="Number of Exams"
                        required
                        style={{ flex: 1 }}
                        min="1"
                      />
                      {((formData.examRegions && formData.examRegions.length > 0) ? formData.examRegions : [{ region: '', numberOfExams: '' }]).length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newRegions = formData.examRegions.filter((_, i) => i !== index);
                            setFormData({ ...formData, examRegions: newRegions });
                          }}
                          className="btn-danger"
                          style={{ padding: '0 12px' }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const currentRegions = (formData.examRegions && formData.examRegions.length > 0) ? formData.examRegions : [{ region: '', numberOfExams: '' }];
                      setFormData({ ...formData, examRegions: [...currentRegions, { region: '', numberOfExams: '' }] });
                    }}
                    className="btn-secondary"
                    style={{ marginTop: '8px' }}
                  >
                    + Add Region
                  </button>
                </div>
              </>
            )}

            {/* Resource Support Specific Fields */}
            {formData.trainingOpportunity === 'Resource Support' && (
              <>
                <div className="form-group">
                  <label>
                    Requirement
                    <span style={{ color: 'red' }}> *</span>
                  </label>
                  <input
                    type="text"
                    value={formData.requirement}
                    onChange={(e) => setFormData({ ...formData, requirement: e.target.value })}
                    placeholder="Enter requirement used"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    No of IDs
                    <span style={{ color: 'red' }}> *</span>
                  </label>
                  <input
                    type="number"
                    value={formData.noOfIds}
                    onChange={(e) => setFormData({ ...formData, noOfIds: e.target.value })}
                    placeholder="Enter number of IDs"
                    required
                    min="1"
                  />
                </div>

                <div className="form-group">
                  <label>
                    Duration
                    <span style={{ color: 'red' }}> *</span>
                  </label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="Enter duration"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Region
                    <span style={{ color: 'red' }}> *</span>
                  </label>
                  <input
                    type="text"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    placeholder="Enter region"
                    required
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label>Attendance (Optional)</label>
              <input
                type="text"
                value={formData.attendance}
                onChange={(e) => setFormData({ ...formData, attendance: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                min={formData.startDate}
              />
            </div>

            <div className="form-group">
              <label>Number of Days</label>
              <input
                type="number"
                value={formData.numberOfDays}
                onChange={(e) => setFormData({ ...formData, numberOfDays: e.target.value })}
                placeholder="Manual Input"
              />
            </div>

            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Enter Location"
              />
            </div>

            {/* Trainer Selection */}
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

            {/* TOV put in Details section like Programs.jsx */}
            <div className="form-group">
              <label>TOV (Billing Amount)</label>
              <input
                type="number"
                value={formData.tov}
                onChange={(e) => setFormData({ ...formData, tov: e.target.value })}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* SECTION 2: Expenses */}
          <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px', marginTop: '30px', color: '#333' }}>Expenses</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Client PO Number</label>
              <input
                type="text"
                value={formData.po}
                onChange={(e) => setFormData({ ...formData, po: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Client PO Date</label>
              <input
                type="date"
                value={formData.poDate}
                onChange={(e) => setFormData({ ...formData, poDate: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Client Invoice Number</label>
              <input
                type="text"
                value={formData.invoiceNumber}
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Client Invoice Date</label>
              <input
                type="date"
                value={formData.invoiceDate}
                onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Payment Terms (Days)</label>
              <input
                type="number"
                value={formData.paymentTerms}
                onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Payment Date</label>
              <input
                type="date"
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                readOnly
              />
            </div>

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

            <div className="form-group">
              <label>Venue Cost</label>
              <input
                type="text"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                placeholder="Enter venue cost"
              />
            </div>

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

            <div className="form-group" style={{
              gridColumn: 'span 2',
              marginTop: '10px',
              background: '#f8f9fa',
              padding: '15px',
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <label style={{ fontSize: '16px', fontWeight: '600', color: '#495057', marginBottom: 0 }}>Final GP</label>
              <div style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: formData.finalGP >= 0 ? '#28a745' : '#dc3545'
              }}>
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(formData.finalGP)}
              </div>
            </div>
          </div>

          <div className="form-actions" style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn-secondary"
              style={{ padding: '10px 24px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{ padding: '10px 30px' }}
            >
              Create Opportunity
            </button>
          </div>
        </form>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Adhoc ID</th>
              <th>Course Name</th>
              <th>End Client</th>
              <th>Start Date</th>
              <th>Status</th>
              <th>Final GP</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {opportunities.map(opportunity => (
              <tr key={opportunity._id}>
                <td><strong>{opportunity.opportunityId}</strong></td>
                <td>{opportunity.courseName || opportunity.clientCompanyName}</td>
                <td>{opportunity.endClient || opportunity.clientCompanyName}</td>
                <td>{new Date(opportunity.expectedStartDate || opportunity.startDate).toLocaleDateString()}</td>
                <td><span className={`status-badge ${(opportunity.trainingStatus || opportunity.opportunityStatus || '').toLowerCase().replace(' ', '-')}`}>
                  {opportunity.trainingStatus || opportunity.opportunityStatus}
                </span></td>
                <td>
                  {opportunity.tov && opportunity.tov > 0
                    ? `${((opportunity.finalGP || 0) / opportunity.tov * 100).toFixed(2)}% (₹${(opportunity.finalGP || 0).toFixed(2)})`
                    : `₹${(opportunity.finalGP || 0).toFixed(2)}`
                  }
                </td>
                <td>
                  <button
                    onClick={() => window.location.href = `/opportunities/${opportunity._id}`}
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

export default OpportunityCreation;
