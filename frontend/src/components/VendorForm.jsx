import { useState, useEffect } from 'react';
import api from '../services/api';

const VendorForm = ({ user, onSuccess, onCancel }) => {
    const [dropdownOptions, setDropdownOptions] = useState({});
    const [formData, setFormData] = useState({
        vendorType: '',
        vendorName: '',
        address: '',
        contactPersonName: [''],
        phone: [''],
        email: '',
        panNumber: '',
        gstNumber: '',
        bankName: '',
        bankAccountNumber: '',
        bankBranchName: '',
        accountType: 'Savings Account',
        ifscCode: '',
        status: 'Active'
    });

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

    const addPhoneNumber = () => {
        setFormData({
            ...formData,
            phone: [...formData.phone, '']
        });
    };

    const removePhoneNumber = (index) => {
        if (formData.phone.length > 1) {
            const newPhones = formData.phone.filter((_, i) => i !== index);
            setFormData({
                ...formData,
                phone: newPhones
            });
        }
    };

    const updatePhoneNumber = (index, value) => {
        const newPhones = [...formData.phone];
        newPhones[index] = value;
        setFormData({
            ...formData,
            phone: newPhones
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Filter out empty contact persons and phone numbers
            const contactPersons = formData.contactPersonName
                .map((name, index) => ({
                    name: name.trim(),
                    phone: formData.phone[index]?.trim() || ''
                }))
                .filter(person => person.name || person.phone);

            if (contactPersons.length === 0) {
                alert('Please add at least one contact person with name or phone number');
                return;
            }

            const phoneNumbers = contactPersons.map(p => p.phone).filter(p => p);
            if (phoneNumbers.length === 0) {
                alert('Please add at least one contact number');
                return;
            }

            const submitData = {
                ...formData,
                contactPersonName: contactPersons.map(p => p.name),
                phone: phoneNumbers
            };

            const response = await api.post('/vendors', submitData);
            if (onSuccess) {
                onSuccess(response.data);
            }
        } catch (error) {
            console.error('Error creating vendor:', error);
            alert(error.response?.data?.error || 'Error creating vendor');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="form-card" style={{ marginTop: 0 }}>
            <h2>Add Vendor</h2>

            <div className="form-section">
                <h3 className="form-section-title">Vendor Information</h3>
                <div className="form-grid">
                    <div className="form-group">
                        <label className="required">Vendor Type</label>
                        <select
                            value={formData.vendorType}
                            onChange={(e) => {
                                const newType = e.target.value;
                                setFormData({
                                    ...formData,
                                    vendorType: newType,
                                    gstNumber: newType === 'Individual' ? '' : formData.gstNumber
                                });
                            }}
                            required
                        >
                            <option value="">Select Vendor Type</option>
                            {dropdownOptions.vendorType?.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="required">Vendor Name</label>
                        <input type="text" value={formData.vendorName} onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })} required />
                    </div>

                    <div className="form-group">
                        <label className="required">Address</label>
                        <textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} required />
                    </div>

                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label className="required">Contact Person(s)</label>
                        <div className="contact-persons-list">
                            {formData.contactPersonName.map((person, index) => (
                                <div key={index} className="contact-person-card">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormData({
                                                ...formData,
                                                contactPersonName: [...formData.contactPersonName, ''],
                                                phone: [...formData.phone, '']
                                            });
                                        }}
                                        className="btn-add-corner"
                                        title="Add Contact Person"
                                    >
                                        +
                                    </button>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'flex-start' }}>
                                        <div>
                                            <label style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Contact Person</label>
                                            <input
                                                type="text"
                                                value={person}
                                                onChange={(e) => {
                                                    const newPersons = [...formData.contactPersonName];
                                                    newPersons[index] = e.target.value;
                                                    setFormData({ ...formData, contactPersonName: newPersons });
                                                }}
                                                placeholder="Contact Person"
                                                required={index === 0}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Phone {index + 1}</label>
                                            <input
                                                type="text"
                                                value={formData.phone[index] || ''}
                                                onChange={(e) => updatePhoneNumber(index, e.target.value)}
                                                placeholder={`Phone ${index + 1} (10+ digits accepted)`}
                                                required={index === 0}
                                            />
                                        </div>
                                    </div>
                                    {formData.contactPersonName.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newPersons = formData.contactPersonName.filter((_, i) => i !== index);
                                                const newPhones = formData.phone.filter((_, i) => i !== index);
                                                setFormData({ ...formData, contactPersonName: newPersons, phone: newPhones });
                                            }}
                                            className="btn-remove"
                                            style={{ marginTop: '12px', width: '100%' }}
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="required">Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="example@gmail.com or corporate@company.com"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="required">PAN Number</label>
                        <input type="text" value={formData.panNumber} onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })} required />
                    </div>

                    <div className="form-group">
                        <label>{formData.vendorType === 'Individual' ? 'GST Number (Optional)' : 'GST Number'} {formData.vendorType !== 'Individual' && formData.vendorType !== '' ? '*' : ''}</label>
                        <input
                            type="text"
                            value={formData.gstNumber}
                            onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                            required={formData.vendorType !== 'Individual' && formData.vendorType !== ''}
                        />
                    </div>
                </div>
            </div>

            <div className="form-section">
                <h3 className="form-section-title">Banking Details</h3>
                <div className="form-grid">
                    <div className="form-group">
                        <label className="required">Bank Name</label>
                        <input
                            type="text"
                            value={formData.bankName}
                            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                            placeholder="Enter bank name"
                            minLength="2"
                            maxLength="100"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="required">Bank Account Number</label>
                        <input
                            type="text"
                            value={formData.bankAccountNumber}
                            onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9]/g, '');
                                setFormData({ ...formData, bankAccountNumber: value });
                            }}
                            placeholder="9-18 digits"
                            minLength="9"
                            maxLength="18"
                            pattern="[0-9]{9,18}"
                            required
                        />
                        <span className="form-helper-text">Enter 9-18 digits only</span>
                    </div>

                    <div className="form-group">
                        <label>Bank Branch Name</label>
                        <input
                            type="text"
                            value={formData.bankBranchName}
                            onChange={(e) => setFormData({ ...formData, bankBranchName: e.target.value })}
                            placeholder="Enter branch name"
                            maxLength="100"
                        />
                    </div>

                    <div className="form-group">
                        <label className="required">Account Type</label>
                        <select
                            value={formData.accountType}
                            onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                            required
                        >
                            <option value="Savings Account">Savings Account</option>
                            <option value="Current Account">Current Account</option>
                            <option value="Salary Account">Salary Account</option>
                            <option value="Fixed Deposit Account">Fixed Deposit Account</option>
                            <option value="Recurring Deposit Account">Recurring Deposit Account</option>
                            <option value="NRI Account">NRI Account</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="required">IFSC Code</label>
                        <input
                            type="text"
                            value={formData.ifscCode}
                            onChange={(e) => {
                                const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                                setFormData({ ...formData, ifscCode: value });
                            }}
                            placeholder="AAAA0XXXXX (e.g., HDFC0001234)"
                            maxLength="11"
                            pattern="[A-Z]{4}0[A-Z0-9]{6}"
                            required
                        />
                        <span className="form-helper-text">Format: 4 letters + 0 + 6 alphanumeric (11 characters)</span>
                    </div>

                    <div className="form-group">
                        <label className="required">Vendor Status</label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            required
                        >
                            <option value="">Select Status</option>
                            {dropdownOptions.vendorStatus?.map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="form-actions">
                <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Create Vendor</button>
            </div>
        </form>
    );
};

export default VendorForm;
