import { useState, useEffect } from 'react';
import api from '../services/api';

const ClientForm = ({ user, onSuccess, onCancel }) => {
    const [dropdownOptions, setDropdownOptions] = useState({});
    const [formData, setFormData] = useState({
        clientName: '',
        trainingSector: '',
        emailId: '',
        location: '',
        linkedinProfile: '',
        hasReportingManager: false,
        reportingManagerDesignation: '',
        reportingManagerContactNumber: '',
        reportingManagerEmailId: '',
        reportingManagerLocation: ''
    });
    const [contactPersons, setContactPersons] = useState([{
        name: '',
        designation: '',
        phoneNumbers: ['']
    }]);
    const [editingContactIndex, setEditingContactIndex] = useState(0); // Start editing the first contact

    useEffect(() => {
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

    const addContactPerson = () => {
        setContactPersons([...contactPersons, {
            name: '',
            designation: '',
            phoneNumbers: ['']
        }]);
        setEditingContactIndex(contactPersons.length);
    };

    const removeContactPerson = (index) => {
        if (index === 0) return; // Cannot remove primary contact
        if (window.confirm('Are you sure you want to remove this contact person?')) {
            const newContacts = contactPersons.filter((_, i) => i !== index);
            setContactPersons(newContacts);
            if (editingContactIndex === index) {
                setEditingContactIndex(null);
            } else if (editingContactIndex > index) {
                setEditingContactIndex(editingContactIndex - 1);
            }
        }
    };

    const updateContactPerson = (index, field, value) => {
        const newContacts = [...contactPersons];
        newContacts[index][field] = value;
        setContactPersons(newContacts);
    };

    const addPhoneNumber = (contactIndex) => {
        const newContacts = [...contactPersons];
        if (newContacts[contactIndex].phoneNumbers.length < 5) {
            newContacts[contactIndex].phoneNumbers.push('');
            setContactPersons(newContacts);
        }
    };

    const removePhoneNumber = (contactIndex, phoneIndex) => {
        const newContacts = [...contactPersons];
        if (newContacts[contactIndex].phoneNumbers.length > 1) {
            newContacts[contactIndex].phoneNumbers = newContacts[contactIndex].phoneNumbers.filter((_, i) => i !== phoneIndex);
            setContactPersons(newContacts);
        }
    };

    const updatePhoneNumber = (contactIndex, phoneIndex, value) => {
        // allow only numbers and limit to 10
        const numericValue = value.replace(/\D/g, '').slice(0, 10);
        const newContacts = [...contactPersons];
        newContacts[contactIndex].phoneNumbers[phoneIndex] = numericValue;
        setContactPersons(newContacts);
    };

    const saveContact = (index) => {
        const contact = contactPersons[index];
        if (!contact.name.trim() || !contact.phoneNumbers.some(p => p.trim())) {
            alert('Contact must have a name and at least one phone number');
            return;
        }
        setEditingContactIndex(null);
    };

    const cancelEditContact = (index) => {
        // If it's a new contact (empty), remove it
        const contact = contactPersons[index];
        if (!contact.name.trim() && !contact.designation.trim() && !contact.phoneNumbers.some(p => p.trim())) {
            removeContactPerson(index);
        }
        setEditingContactIndex(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Validate primary contact
            const primaryContact = contactPersons[0];
            if (!primaryContact.name.trim() || !primaryContact.phoneNumbers.some(p => p.trim())) {
                alert('Primary contact must have a name and at least one phone number');
                return;
            }

            // Process contacts for backend
            const processedContacts = contactPersons.map(contact => ({
                ...contact,
                phoneNumbers: contact.phoneNumbers.filter(phone => phone.trim() !== '')
            })).filter(contact => contact.name.trim() || contact.phoneNumbers.length > 0);

            if (processedContacts.length === 0) {
                alert('Please add at least one contact person');
                return;
            }

            // Transform to backend format
            const submitData = {
                ...formData,
                contactPersonName: processedContacts.map(c => c.name),
                designation: processedContacts.map(c => c.designation),
                contactNumber: processedContacts.map(c => c.phoneNumbers).flat()
            };

            const response = await api.post('/clients', submitData);

            if (onSuccess) {
                onSuccess(response.data);
            }
        } catch (error) {
            console.error('Error creating client:', error);
            alert(error.response?.data?.error || 'Error creating client');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="form-card" style={{ marginTop: 0 }}>
            <h2>Add Client</h2>

            <div className="client-creation-layout">
                {/* LEFT SECTION: Client Details (60%) */}
                <div className="client-details-section">
                    <div className="section-header">
                        <h3 className="section-title">Client Details</h3>
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="required">Client Name</label>
                            <input
                                type="text"
                                value={formData.clientName}
                                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="required">Training Sectors</label>
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

                        <div className="form-group">
                            <label className="required">Email ID</label>
                            <input
                                type="email"
                                value={formData.emailId}
                                onChange={(e) => setFormData({ ...formData, emailId: e.target.value })}
                                placeholder="example@gmail.com or corporate@company.com"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="required">Location</label>
                            <input
                                type="text"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>LinkedIn / Website URL (Optional)</label>
                            <input
                                type="url"
                                value={formData.linkedinProfile || ''}
                                onChange={(e) => setFormData({ ...formData, linkedinProfile: e.target.value })}
                                placeholder="https://www.linkedin.com/company/..."
                            />
                        </div>

                        <div className="form-group checkbox-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.hasReportingManager}
                                    onChange={(e) => setFormData({ ...formData, hasReportingManager: e.target.checked })}
                                    className="form-checkbox"
                                />
                                <span>Has Reporting Manager (Optional)</span>
                            </label>
                        </div>
                    </div>

                    {formData.hasReportingManager && (
                        <div className="reporting-manager-section">
                            <h4 className="subsection-title">Reporting Manager Details</h4>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Designation</label>
                                    <input
                                        type="text"
                                        value={formData.reportingManagerDesignation}
                                        onChange={(e) => setFormData({ ...formData, reportingManagerDesignation: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Contact Number</label>
                                    <input
                                        type="text"
                                        value={formData.reportingManagerContactNumber}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                            setFormData({ ...formData, reportingManagerContactNumber: val });
                                        }}
                                        placeholder="10 digit mobile number"
                                        maxLength={10}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Email ID</label>
                                    <input
                                        type="email"
                                        value={formData.reportingManagerEmailId}
                                        onChange={(e) => setFormData({ ...formData, reportingManagerEmailId: e.target.value })}
                                        placeholder="example@gmail.com"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Location</label>
                                    <input
                                        type="text"
                                        value={formData.reportingManagerLocation}
                                        onChange={(e) => setFormData({ ...formData, reportingManagerLocation: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="form-group" style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>SOW / Agreement</label>
                        <div style={{ border: '1px dashed #d1d5db', padding: '20px', borderRadius: '6px', textAlign: 'center', background: '#f9fafb' }}>
                            <input type="file" multiple style={{ display: 'block', width: '100%' }} />
                            <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '8px' }}>
                                Upload SOW or Agreement documents (Multiple files allowed)
                            </p>
                        </div>
                    </div>
                </div>

                {/* RIGHT SECTION: Contact Persons Panel (40%) */}
                <div className="contact-persons-panel">
                    <div className="panel-header">
                        <h3 className="section-title">Contact Persons</h3>
                        <button
                            type="button"
                            onClick={addContactPerson}
                            className="btn-secondary btn-add-contact-panel"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            Add Contact Person
                        </button>
                    </div>

                    <div className="contact-cards-container">
                        {contactPersons.map((contact, index) => (
                            <div key={index} className="contact-card">
                                {editingContactIndex === index ? (
                                    // EDIT MODE
                                    <div className="contact-card-editor">
                                        <div className="editor-header">
                                            <span className="contact-label">
                                                {index === 0 ? 'Primary Contact' : `Contact ${index + 1}`}
                                            </span>
                                        </div>
                                        <div className="editor-fields">
                                            <div className="form-group">
                                                <label className="required">Contact Person Name</label>
                                                <input
                                                    type="text"
                                                    value={contact.name}
                                                    onChange={(e) => updateContactPerson(index, 'name', e.target.value)}
                                                    placeholder="Enter name"
                                                    required
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Designation</label>
                                                <input
                                                    type="text"
                                                    value={contact.designation}
                                                    onChange={(e) => updateContactPerson(index, 'designation', e.target.value)}
                                                    placeholder="Enter designation"
                                                />
                                            </div>
                                            <div className="phone-numbers-editor">
                                                <label className="phone-section-label">
                                                    Contact Number{contact.phoneNumbers.length > 1 ? 's' : ''}
                                                    {index === 0 && <span className="required-indicator"> *</span>}
                                                </label>
                                                {contact.phoneNumbers.map((phone, phoneIndex) => (
                                                    <div key={phoneIndex} className="phone-input-row">
                                                        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                                                            <input
                                                                type="text"
                                                                value={phone}
                                                                onChange={(e) => updatePhoneNumber(index, phoneIndex, e.target.value)}
                                                                placeholder={`Phone ${phoneIndex + 1} (10+ digits)`}
                                                                required={index === 0 && phoneIndex === 0}
                                                            />
                                                        </div>
                                                        {contact.phoneNumbers.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removePhoneNumber(index, phoneIndex)}
                                                                className="btn-remove-phone"
                                                                title="Remove phone number"
                                                            >
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                                                </svg>
                                                            </button>
                                                        )}
                                                        {phoneIndex === contact.phoneNumbers.length - 1 && contact.phoneNumbers.length < 5 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => addPhoneNumber(index)}
                                                                className="btn-add-phone"
                                                                title="Add phone number"
                                                            >
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="editor-actions">
                                            <button
                                                type="button"
                                                onClick={() => cancelEditContact(index)}
                                                className="btn-secondary"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => saveContact(index)}
                                                className="btn-primary"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    // DISPLAY MODE
                                    <div className="contact-card-display">
                                        {/* HEADER: Avatar + Name + Designation */}
                                        <div className="contact-card-header">
                                            <div className="contact-icon">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                                    <circle cx="12" cy="7" r="4"></circle>
                                                </svg>
                                            </div>
                                            <div className="contact-info">
                                                <div className="contact-name">
                                                    {contact.name || 'New Contact (Draft)'}
                                                </div>
                                                <div className="contact-designation">
                                                    {contact.designation || 'No designation'}
                                                </div>
                                                {!contact.name && (
                                                    <div className="contact-helper-text">
                                                        Click Edit to add contact details
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* BODY: Contact Details */}
                                        <div className="contact-card-body">
                                            <div className="contact-phones">
                                                {contact.phoneNumbers.filter(p => p.trim()).map((phone, phoneIndex) => (
                                                    <div key={phoneIndex} className="phone-display">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px', flexShrink: 0 }}>
                                                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                                        </svg>
                                                        <span>{phone}</span>
                                                    </div>
                                                ))}
                                                {!contact.phoneNumbers.some(p => p.trim()) && (
                                                    <div className="phone-display empty">No phone numbers</div>
                                                )}
                                            </div>
                                        </div>

                                        {/* FOOTER: Badge + Actions */}
                                        <div className="contact-card-footer">
                                            {index === 0 && (
                                                <span className="primary-contact-badge">Primary Contact</span>
                                            )}
                                            {index > 0 && <span></span>}
                                            <div className="contact-actions">
                                                <button
                                                    type="button"
                                                    onClick={() => setEditingContactIndex(index)}
                                                    className="btn-icon-edit"
                                                    title="Edit contact"
                                                    aria-label="Edit contact"
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                    </svg>
                                                </button>
                                                {index > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeContactPerson(index)}
                                                        className="btn-icon-remove"
                                                        title="Remove contact"
                                                        aria-label="Remove contact"
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <polyline points="3 6 5 6 21 6"></polyline>
                                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="form-actions">
                <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary btn-create-client">Create Client</button>
            </div>
        </form>
    );
};

export default ClientForm;
