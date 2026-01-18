import { useState, useEffect } from 'react';
import api from '../services/api';
import './Table.css';

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
    
    // Validation for Vouchers
    if (formData.trainingOpportunity === 'Vouchers') {
      if (!formData.examRegions || formData.examRegions.length === 0) {
        alert('Please add at least one exam region with number of exams');
        return;
      }
      const invalidRegion = formData.examRegions.find(r => !r.region || !r.numberOfExams);
      if (invalidRegion) {
        alert('Please fill in all exam region details (region and number of exams)');
        return;
      }
    }
    
    try {
      const submitData = {
        ...formData,
        technology: formData.technology === 'Other' ? formData.technologyOther : formData.technology,
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
      alert(error.response?.data?.error || 'Error creating opportunity');
    }
  };

  if (loading) return <div>Loading...</div>;

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
          <h2>Add Opportunity</h2>
          <div className="form-grid">
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

            {/* Adhoc ID */}
            <div className="form-group">
              <label>Adhoc ID</label>
              <input 
                type="text" 
                value={formData.adhocId} 
                onChange={(e) => setFormData({ ...formData, adhocId: e.target.value })} 
              />
            </div>

            {/* Billing Client */}
            <div className="form-group">
              <label>Billing Client</label>
              <input 
                type="text" 
                value={formData.billingClient} 
                onChange={(e) => setFormData({ ...formData, billingClient: e.target.value })} 
                required
              />
            </div>

            {/* End Client */}
            <div className="form-group">
              <label>End Client</label>
              <select 
                value={formData.endClient} 
                onChange={(e) => setFormData({ ...formData, endClient: e.target.value })} 
                required
              >
                <option value="">Select End Client</option>
                {clients.map(client => (
                  <option key={client._id} value={client.clientName}>{client.clientName}</option>
                ))}
              </select>
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

            {/* Technology - Always shown for all types */}
            <div className="form-group">
              <label>
                Technology
                {(formData.trainingOpportunity === 'Training' || formData.trainingOpportunity === 'Vouchers' || formData.trainingOpportunity === 'Resource Support') && <span style={{ color: 'red' }}> *</span>}
              </label>
              <select 
                value={formData.technology} 
                onChange={(e) => setFormData({ ...formData, technology: e.target.value, technologyOther: '' })} 
                required={formData.trainingOpportunity === 'Training' || formData.trainingOpportunity === 'Vouchers' || formData.trainingOpportunity === 'Resource Support'}
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
                  required={formData.trainingOpportunity === 'Training' || formData.trainingOpportunity === 'Vouchers' || formData.trainingOpportunity === 'Resource Support'}
                  style={{ marginTop: '8px' }}
                />
              )}
            </div>

            {/* Training Specific Fields */}
            {formData.trainingOpportunity === 'Training' && (
              <>
                {/* Training name / Requirement */}
                <div className="form-group">
                  <label>
                    Training name / Requirement
                    <span style={{ color: 'red' }}> *</span>
                  </label>
                  <input 
                    type="text" 
                    value={formData.courseName} 
                    onChange={(e) => setFormData({ ...formData, courseName: e.target.value })} 
                    placeholder="Enter training name"
                    required
                  />
                </div>

                {/* Mode of training */}
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

                {/* Batch Size */}
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

                {/* Training Location (if Classroom/Hybrid) */}
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
                {/* Exam Details */}
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

                {/* No of Vouchers */}
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

                {/* Exam Location */}
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

                {/* Exam Regions (options to select different location & number of exams under each region) */}
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
                        placeholder="No. of Exams"
                        required
                        min="1"
                        style={{ width: '150px' }}
                      />
                      {((formData.examRegions && formData.examRegions.length > 0) ? formData.examRegions.length : 1) > 1 && (
                        <button 
                          type="button" 
                          onClick={() => {
                            const currentRegions = (formData.examRegions && formData.examRegions.length > 0) ? formData.examRegions : [{ region: '', numberOfExams: '' }];
                            const newRegions = currentRegions.filter((_, i) => i !== index);
                            setFormData({ ...formData, examRegions: newRegions });
                          }}
                          className="btn-remove"
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
                      setFormData({ 
                        ...formData, 
                        examRegions: [...currentRegions, { region: '', numberOfExams: '' }] 
                      });
                    }}
                    className="btn-add"
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
                {/* Requirement */}
                <div className="form-group">
                  <label>
                    Requirement
                    <span style={{ color: 'red' }}> *</span>
                  </label>
                  <textarea 
                    value={formData.requirement} 
                    onChange={(e) => setFormData({ ...formData, requirement: e.target.value })} 
                    placeholder="Enter requirement details"
                    required
                    rows="3"
                  />
                </div>

                {/* No of ID's */}
                <div className="form-group">
                  <label>
                    No of ID's
                    <span style={{ color: 'red' }}> *</span>
                  </label>
                  <input 
                    type="number" 
                    value={formData.noOfIds} 
                    onChange={(e) => setFormData({ ...formData, noOfIds: e.target.value })} 
                    placeholder="Enter number of IDs"
                    required
                    min="1"
                    step="1"
                  />
                </div>

                {/* Duration */}
                <div className="form-group">
                  <label>
                    Duration
                    <span style={{ color: 'red' }}> *</span>
                  </label>
                  <input 
                    type="text" 
                    value={formData.duration} 
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })} 
                    placeholder="e.g., 3 months, 6 months"
                    required
                  />
                </div>

                {/* Region */}
                <div className="form-group">
                  <label>
                    Region
                    <span style={{ color: 'red' }}> *</span>
                  </label>
                  <select 
                    value={formData.region} 
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })} 
                    required
                  >
                    <option value="">Select Region</option>
                    <option value="North">North</option>
                    <option value="South">South</option>
                    <option value="East">East</option>
                    <option value="West">West</option>
                    <option value="Central">Central</option>
                    <option value="Northeast">Northeast</option>
                  </select>
                </div>
              </>
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
                step="any"
              />
            </div>

            {/* PO */}
            <div className="form-group">
              <label>PO</label>
              <input 
                type="text" 
                value={formData.po} 
                onChange={(e) => setFormData({ ...formData, po: e.target.value })} 
              />
            </div>

            {/* PO Date */}
            <div className="form-group">
              <label>PO Date</label>
              <input 
                type="date" 
                value={formData.poDate} 
                onChange={(e) => setFormData({ ...formData, poDate: e.target.value })} 
              />
            </div>

            {/* Invoice Number */}
            <div className="form-group">
              <label>Invoice Number</label>
              <input 
                type="text" 
                value={formData.invoiceNumber} 
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })} 
              />
            </div>

            {/* Invoice Date */}
            <div className="form-group">
              <label>Invoice Date</label>
              <input 
                type="date" 
                value={formData.invoiceDate} 
                onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })} 
              />
            </div>

            {/* Payment Terms */}
            <div className="form-group">
              <label>Payment Terms</label>
              <input 
                type="text" 
                value={formData.paymentTerms} 
                onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })} 
              />
            </div>

            {/* Payment Date */}
            <div className="form-group">
              <label>Payment Date</label>
              <input 
                type="date" 
                value={formData.paymentDate} 
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })} 
              />
            </div>

            {/* Trainer PO Values */}
            <div className="form-group">
              <label>Trainer PO Values</label>
              <input 
                type="number" 
                value={formData.trainerPOValues} 
                onChange={(e) => setFormData({ ...formData, trainerPOValues: e.target.value })} 
                min="0"
                step="0.01"
              />
            </div>

            {/* Lab PO Value */}
            <div className="form-group">
              <label>Lab PO Value</label>
              <input 
                type="number" 
                value={formData.labPOValue} 
                onChange={(e) => setFormData({ ...formData, labPOValue: e.target.value })} 
                min="0"
                step="0.01"
              />
            </div>

            {/* Course Material */}
            <div className="form-group">
              <label>Course Material</label>
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

            {/* Venue */}
            <div className="form-group">
              <label>Venue</label>
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

            {/* Accommodation */}
            <div className="form-group">
              <label>Accommodation</label>
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
              {showMarketingPopup && (
                <>
                  <div 
                    style={{ 
                      position: 'fixed', 
                      top: 0, 
                      left: 0, 
                      right: 0, 
                      bottom: 0, 
                      backgroundColor: 'rgba(0,0,0,0.5)', 
                      zIndex: 999 
                    }}
                    onClick={() => setShowMarketingPopup(false)}
                  />
                  <div style={{ 
                    position: 'fixed', 
                    top: '50%', 
                    left: '50%', 
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    zIndex: 1000,
                    minWidth: '300px'
                  }}>
                    <h3>Select Marketing Charges %</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                      {dropdownOptions.marketingChargesPercent?.map(pct => (
                        <button 
                          key={pct} 
                          type="button"
                          onClick={() => handleMarketingCharges(pct)}
                          style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          {pct}%
                        </button>
                      ))}
                      <div style={{ marginTop: '8px' }}>
                        <input 
                          type="number" 
                          placeholder="Manual Amount" 
                          value={formData.marketingChargesManual}
                          onChange={(e) => setFormData({ ...formData, marketingChargesManual: e.target.value })}
                          style={{ width: '100%', padding: '8px', marginBottom: '8px' }}
                        />
                        <button 
                          type="button"
                          onClick={() => handleMarketingCharges('manual')}
                          style={{ width: '100%', padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Set Manual Amount
                        </button>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setShowMarketingPopup(false)}
                        style={{ padding: '10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
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
              <select 
                value={formData.contingencyPercent || ''} 
                onChange={(e) => {
                  const selectedPercent = e.target.value;
                  if (selectedPercent === '') {
                    setFormData(prev => ({ 
                      ...prev, 
                      contingencyPercent: '', 
                      contingencyAmount: '',
                      contingencyManual: ''
                    }));
                  } else {
                    const pct = parseFloat(selectedPercent);
                    const amount = (parseFloat(formData.tov) || 0) * (pct / 100);
                    setFormData(prev => ({ 
                      ...prev, 
                      contingencyPercent: pct, 
                      contingencyAmount: amount,
                      contingencyManual: ''
                    }));
                  }
                }}
              >
                <option value="">Select Contingency %</option>
                <option value="15">15%</option>
                <option value="10">10%</option>
              </select>
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
                style={{ backgroundColor: '#f0f0f0', fontWeight: 'bold' }}
              />
            </div>
          </div>
          <button type="submit" className="btn-primary">Create Opportunity</button>
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
