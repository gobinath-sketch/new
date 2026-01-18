import { useState, useEffect } from 'react';
import './Table.css';

const Settings = ({ user }) => {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    lowGPAlerts: true,
    dashboardRefresh: 5,
    theme: 'light',
    dateFormat: 'DD/MM/YYYY',
    timeZone: 'Asia/Kolkata',
    autoSave: true,
    itemsPerPage: 10
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    // Load saved settings from localStorage
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      try {
        setSettings({ ...settings, ...JSON.parse(savedSettings) });
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, []);

  const handleSettingChange = (key, value) => {
    const updatedSettings = { ...settings, [key]: value };
    setSettings(updatedSettings);
    // Save to localStorage immediately
    localStorage.setItem('userSettings', JSON.stringify(updatedSettings));
  };

  const handleSave = () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    // Save settings to localStorage
    localStorage.setItem('userSettings', JSON.stringify(settings));

    setTimeout(() => {
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      setLoading(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }, 500);
  };

  const handleReset = () => {
    const defaultSettings = {
      emailNotifications: true,
      lowGPAlerts: true,
      dashboardRefresh: 5,
      theme: 'light',
      dateFormat: 'DD/MM/YYYY',
      timeZone: 'Asia/Kolkata',
      autoSave: true,
      itemsPerPage: 10
    };
    setSettings(defaultSettings);
    localStorage.setItem('userSettings', JSON.stringify(defaultSettings));
    setMessage({ type: 'success', text: 'Settings reset to default values!' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
      </div>

      {message.text && (
        <div className={message.type === 'success' ? 'success-message' : 'error-message'}>
          {message.text}
        </div>
      )}

      <div className="form-card">
        <h2>Notification Settings</h2>
        <div className="form-grid">
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <div className="settings-item">
              <div className="settings-item-content">
                <label className="settings-item-label">Email Notifications</label>
                <p className="settings-item-description">Receive email notifications for important updates</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <div className="settings-item">
              <div className="settings-item-content">
                <label className="settings-item-label">Low GP Alerts</label>
                <p className="settings-item-description">Receive alerts for opportunities/programs with low GP</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.lowGPAlerts}
                  onChange={(e) => handleSettingChange('lowGPAlerts', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="form-card">
        <h2>Dashboard Settings</h2>
        <div className="form-grid">
          <div className="form-group">
            <label>Auto-Refresh Interval (seconds)</label>
            <select
              value={settings.dashboardRefresh}
              onChange={(e) => handleSettingChange('dashboardRefresh', parseInt(e.target.value))}
            >
              <option value={5}>5 seconds</option>
              <option value={10}>10 seconds</option>
              <option value={30}>30 seconds</option>
              <option value={60}>1 minute</option>
              <option value={0}>Disabled</option>
            </select>
            <span className="form-helper-text">How often the dashboard refreshes automatically</span>
          </div>
          <div className="form-group">
            <label>Items Per Page</label>
            <select
              value={settings.itemsPerPage}
              onChange={(e) => handleSettingChange('itemsPerPage', parseInt(e.target.value))}
            >
              <option value={10}>10 items</option>
              <option value={25}>25 items</option>
              <option value={50}>50 items</option>
              <option value={100}>100 items</option>
            </select>
            <span className="form-helper-text">Number of items to display per page in tables</span>
          </div>
        </div>
      </div>

      <div className="form-card">
        <h2>Appearance & Preferences</h2>
        <div className="form-grid">
          <div className="form-group">
            <label>Theme</label>
            <select
              value={settings.theme}
              onChange={(e) => handleSettingChange('theme', e.target.value)}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto (System)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Date Format</label>
            <select
              value={settings.dateFormat}
              onChange={(e) => handleSettingChange('dateFormat', e.target.value)}
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
          <div className="form-group">
            <label>Time Zone</label>
            <select
              value={settings.timeZone}
              onChange={(e) => handleSettingChange('timeZone', e.target.value)}
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <div className="settings-item">
              <div className="settings-item-content">
                <label className="settings-item-label">Auto-Save Forms</label>
                <p className="settings-item-description">Automatically save form data while typing</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.autoSave}
                  onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button onClick={handleReset} className="btn-secondary">
          Reset to Default
        </button>
        <button onClick={handleSave} className="btn-primary" disabled={loading}>
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default Settings;
