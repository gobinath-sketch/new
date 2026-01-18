import { useState } from 'react';
import api from '../services/api';
import './Table.css';

const Profile = ({ user, setUser }) => {
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await api.put('/auth/profile', formData);
      setUser(response.data.user);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setEditMode(false);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
      setLoading(false);
      return;
    }

    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to change password' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
        {!editMode && (
          <button onClick={() => setEditMode(true)} className="btn-primary">
            Edit Profile
          </button>
        )}
      </div>

      {message.text && (
        <div className={message.type === 'success' ? 'success-message' : 'error-message'}>
          {message.text}
        </div>
      )}

      <div className="form-card">
        <h2>Profile Information</h2>
        {!editMode ? (
          <div className="form-grid">
            <div className="form-group">
              <label><strong>Name</strong></label>
              <div className="display-field">{user?.name || 'N/A'}</div>
            </div>
            <div className="form-group">
              <label><strong>Email</strong></label>
              <div className="display-field">{user?.email || 'N/A'}</div>
            </div>
            <div className="form-group">
              <label><strong>Role</strong></label>
              <div className="display-field">
                {user?.role || 'N/A'}
                {user?.subRole && ` (${user.subRole === 'SalesExecutive' ? 'Sales Executive' : 'Sales Manager'})`}
              </div>
            </div>
            <div className="form-group">
              <label><strong>User ID</strong></label>
              <div className="display-field">{user?.id || 'N/A'}</div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleProfileUpdate}>
            <div className="form-grid">
              <div className="form-group">
                <label className="required">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="required">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <div className="display-field">
                  {user?.role || 'N/A'}
                  {user?.subRole && ` (${user.subRole === 'SalesExecutive' ? 'Sales Executive' : 'Sales Manager'})`}
                </div>
              </div>
            </div>
            <div className="form-actions">
              <button type="button" onClick={() => {
                setEditMode(false);
                setFormData({ name: user?.name || '', email: user?.email || '' });
                setMessage({ type: '', text: '' });
              }} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="form-card">
        <h2>Change Password</h2>
        <form onSubmit={handlePasswordChange}>
          <div className="form-grid">
            <div className="form-group">
              <label className="required">Current Password</label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="required">New Password</label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                required
                minLength="6"
              />
              <span className="form-helper-text">Must be at least 6 characters long</span>
            </div>
            <div className="form-group">
              <label className="required">Confirm New Password</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                required
                minLength="6"
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Changing Password...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
