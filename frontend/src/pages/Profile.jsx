import { useEffect, useMemo, useRef, useState } from 'react';
import api from '../services/api';
import './Table.css';

const Profile = ({ user, setUser }) => {
  const avatarInputRef = useRef(null);
  const [avatarUrl, setAvatarUrl] = useState('');
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

  const userInitials = useMemo(() => {
    const name = (user?.name || '').trim();
    if (!name) return 'U';
    const parts = name.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] || 'U';
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : '';
    return `${first}${last}`.toUpperCase();
  }, [user?.name]);

  const createdAtText = useMemo(() => {
    if (!user?.createdAt) return 'N/A';
    const d = new Date(user.createdAt);
    if (Number.isNaN(d.getTime())) return 'N/A';
    return d.toLocaleString();
  }, [user?.createdAt]);

  const updatedAtText = useMemo(() => {
    if (!user?.updatedAt) return 'N/A';
    const d = new Date(user.updatedAt);
    if (Number.isNaN(d.getTime())) return 'N/A';
    return d.toLocaleString();
  }, [user?.updatedAt]);

  useEffect(() => {
    setAvatarUrl(user?.avatarDataUrl || '');
  }, [user?.avatarDataUrl]);

  const handlePickAvatar = () => {
    if (avatarInputRef.current) avatarInputRef.current.click();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    if (!file) return;

    if (!file.type?.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file.' });
      e.target.value = '';
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size must be 50MB or less.' });
      e.target.value = '';
      return;
    }

    const compressAndUpload = async () => {
      try {
        setLoading(true);
        setMessage({ type: '', text: '' });

        const imgUrl = URL.createObjectURL(file);
        const img = new Image();

        const dataUrl = await new Promise((resolve, reject) => {
          img.onload = () => {
            try {
              const maxDim = 512;
              const w = img.naturalWidth || img.width;
              const h = img.naturalHeight || img.height;
              const scale = Math.min(1, maxDim / Math.max(w, h));
              const targetW = Math.max(1, Math.round(w * scale));
              const targetH = Math.max(1, Math.round(h * scale));

              const canvas = document.createElement('canvas');
              canvas.width = targetW;
              canvas.height = targetH;
              const ctx = canvas.getContext('2d');
              if (!ctx) throw new Error('Canvas not supported');

              ctx.drawImage(img, 0, 0, targetW, targetH);

              // JPEG compression keeps the avatarDataUrl small & MongoDB-safe.
              const out = canvas.toDataURL('image/jpeg', 0.82);
              resolve(out);
            } catch (err) {
              reject(err);
            }
          };
          img.onerror = () => reject(new Error('Unable to decode image'));
          img.src = imgUrl;
        });

        URL.revokeObjectURL(imgUrl);

        const response = await api.put('/auth/avatar', { avatarDataUrl: dataUrl });
        setUser(response.data.user);
        setAvatarUrl(response.data.user?.avatarDataUrl || '');
        setMessage({ type: 'success', text: 'Profile photo updated.' });
        setTimeout(() => setMessage({ type: '', text: '' }), 2500);
      } catch (error) {
        setMessage({ type: 'error', text: error.response?.data?.error || error.message || 'Failed to update profile photo' });
      } finally {
        setLoading(false);
      }
    };

    compressAndUpload();
    e.target.value = '';
  };

  const handleRemoveAvatar = () => {
    const run = async () => {
      try {
        setLoading(true);
        const response = await api.put('/auth/avatar', { avatarDataUrl: '' });
        setUser(response.data.user);
        setAvatarUrl('');
        setMessage({ type: 'success', text: 'Profile photo removed.' });
        setTimeout(() => setMessage({ type: '', text: '' }), 2500);
      } catch (error) {
        setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to remove profile photo' });
      } finally {
        setLoading(false);
      }
    };

    run();
  };

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
    <div className="profile-page">
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
        <div className="profile-summary">
          <div className="profile-summary-left">
            <div
              className="profile-avatar profile-avatar-clickable"
              role="button"
              tabIndex={0}
              onClick={handlePickAvatar}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handlePickAvatar();
                }
              }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="profile-avatar-img" />
              ) : (
                <div className="profile-avatar-text">{userInitials}</div>
              )}
            </div>

            <div className="profile-summary-meta">
              <div className="profile-summary-name">{user?.name || 'User'}</div>
              <div className="profile-summary-sub">{user?.role || ''}</div>
              <div className="profile-summary-sub">{user?.email || ''}</div>
            </div>
          </div>

          <div className="profile-summary-actions">
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
            <button type="button" className="btn-secondary" onClick={handleRemoveAvatar} disabled={!avatarUrl || loading}>
              Remove
            </button>
          </div>
        </div>
        <div className="form-helper-text profile-summary-helper"></div>
      </div>

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
            <div className="form-group">
              <label><strong>Created</strong></label>
              <div className="display-field">{createdAtText}</div>
            </div>
            <div className="form-group">
              <label><strong>Last Updated</strong></label>
              <div className="display-field">{updatedAtText}</div>
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
