import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { removeAuthToken } from '../services/auth';
import api from '../services/api';
import './Layout.css';

const SidebarIcon = ({ name }) => {
  switch (name) {
    case 'dashboard':
      return (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 13h8V3H3v10z" />
          <path d="M13 21h8V11h-8v10z" />
          <path d="M13 3h8v6h-8V3z" />
          <path d="M3 17h8v4H3v-4z" />
        </svg>
      );
    case 'clients':
      return (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case 'opportunity':
      return (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      );
    case 'opportunities':
      return (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8" />
          <path d="M18 19V5" />
          <path d="M15 16v-6" />
          <path d="M12 21V3" />
          <path d="M9 18V6" />
          <path d="M6 16V8" />
          <path d="M3 19V5" />
        </svg>
      );
    case 'vendors':
      return (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 7l9-4 9 4-9 4-9-4z" />
          <path d="M3 7v10l9 4 9-4V7" />
          <path d="M12 11v10" />
        </svg>
      );
    case 'programs':
      return (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          <path d="M8 7h8" />
          <path d="M8 11h8" />
        </svg>
      );
    case 'finance':
      return (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1v22" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      );
    case 'receivables':
      return (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a9 9 0 1 1-9-9" />
          <path d="M22 4L12 14l-3-3" />
        </svg>
      );
    case 'payables':
      return (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14" />
          <path d="M19 12H5" />
        </svg>
      );
    case 'gp':
      return (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18" />
          <path d="M7 14l3-3 4 4 6-6" />
        </svg>
      );
    case 'governance':
      return (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l8 4v6c0 5-3.5 9.5-8 11-4.5-1.5-8-6-8-11V7l8-4z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    case 'profile':
      return (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case 'settings':
      return (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c0 .66.26 1.3.73 1.77.47.47 1.11.73 1.77.73H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
    case 'downloads':
      return (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <path d="M7 10l5 5 5-5" />
          <path d="M12 15V3" />
        </svg>
      );
    default:
      return (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6h16" />
          <path d="M4 12h16" />
          <path d="M4 18h16" />
        </svg>
      );
  }
};

const getIconName = (item) => {
  if (!item) return 'default';
  if (item.icon) return item.icon;

  const label = (item.label || '').toLowerCase();
  if (label === 'dashboard') return 'dashboard';
  if (label.includes('client')) return 'clients';
  if (label === 'create opportunity') return 'opportunity';
  if (label === 'opportunities') return 'opportunities';
  if (label === 'vendors') return 'vendors';
  if (label === 'programs') return 'programs';
  if (label.includes('receivables')) return 'receivables';
  if (label.includes('payables')) return 'payables';
  if (label === 'gp') return 'gp';
  if (label === 'governance') return 'governance';
  if (label === 'profile') return 'profile';
  if (label === 'settings') return 'settings';
  if (label === 'downloads') return 'downloads';

  return 'default';
};

const Layout = ({ children, user, setUser }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const userInitials = useMemo(() => {
    const name = (user?.name || '').trim();
    if (!name) return 'U';
    const parts = name.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] || 'U';
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : '';
    return `${first}${last}`.toUpperCase();
  }, [user?.name]);

  const handleLogout = () => {
    removeAuthToken();
    setUser(null);
    navigate('/login');
  };

  const downloadsCount = Array.isArray(user?.downloads) ? user.downloads.length : 0;

  const [expandedMenus, setExpandedMenus] = useState({ Finance: true });
  const [downloadsOpen, setDownloadsOpen] = useState(false);
  const [deletingDownloadIds, setDeletingDownloadIds] = useState(() => new Set());

  useEffect(() => {
    const onOpenDownloads = () => setDownloadsOpen(true);
    window.addEventListener('openDownloadsPanel', onOpenDownloads);
    return () => window.removeEventListener('openDownloadsPanel', onOpenDownloads);
  }, []);

  const openDownload = (item) => {
    const html = item?.contentHtml;
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  };

  const deleteDownload = async (id) => {
    if (!id) return;
    try {
      setDeletingDownloadIds((prev) => {
        const next = new Set(prev);
        next.add(String(id));
        return next;
      });

      // Allow animation to play before list updates.
      await new Promise((r) => setTimeout(r, 180));
      const response = await api.delete(`/auth/downloads/${id}`);
      if (setUser && response?.data?.user) setUser(response.data.user);
    } catch {
      // ignore
    } finally {
      setDeletingDownloadIds((prev) => {
        const next = new Set(prev);
        next.delete(String(id));
        return next;
      });
    }
  };

  const toggleMenu = (menuLabel) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuLabel]: !prev[menuLabel]
    }));
  };

  const getMenuItems = () => {
    const role = user?.role;

    // Define base structure
    const structure = [
      {
        path: '/',
        label: 'Dashboard',
        roles: ['Operations Manager', 'Business Head', 'Finance Manager', 'Director', 'Sales Executive', 'Sales Manager']
      },
      {
        path: '/client-creation',
        label: 'Create Client',
        roles: ['Sales Executive', 'Sales Manager', 'Director']
      },
      {
        path: '/opportunity-creation',
        label: 'Create Opportunity',
        roles: ['Sales Executive', 'Sales Manager']
      },
      {
        path: '/opportunities',
        label: 'Opportunities',
        roles: ['Business Head', 'Director', 'Sales Executive', 'Sales Manager', 'Operations Manager', 'Finance Manager']
      },
      {
        path: '/vendors',
        label: 'Vendors',
        roles: ['Operations Manager', 'Finance Manager', 'Director']
      },
      {
        path: '/programs',
        label: 'Programs',
        roles: ['Operations Manager']
      },
      {
        label: 'Finance',
        path: '#', // Non-clickable parent
        icon: 'finance',
        roles: ['Finance Manager', 'Director', 'Operations Manager'], // Ops Manager needs access to POs
        children: [
          {
            path: '/receivables',
            label: 'Client Receivables',
            roles: ['Finance Manager', 'Director']
          },
          {
            path: '/payables',
            label: 'Vendor Payables',
            roles: ['Finance Manager', 'Director']
          },
          {
            path: '/gp',
            label: 'GP',
            roles: ['Finance Manager', 'Director']
          }
        ]
      },
      {
        path: '/governance',
        label: 'Governance',
        roles: ['Director']
      },
      {
        path: '/profile',
        label: 'Profile',
        roles: ['Operations Manager', 'Business Head', 'Finance Manager', 'Director', 'Sales Executive', 'Sales Manager']
      },
      {
        path: '/settings',
        label: 'Settings',
        roles: ['Operations Manager', 'Business Head', 'Finance Manager', 'Director', 'Sales Executive', 'Sales Manager']
      }
    ];

    // Recursive filter function
    const filterItems = (items) => {
      return items.reduce((acc, item) => {
        // Check if user has role for this item
        if (!item.roles.includes(role)) return acc;

        // If it has children, filter them too
        if (item.children) {
          const filteredChildren = filterItems(item.children);
          // Only include parent if it has visible children
          if (filteredChildren.length > 0) {
            acc.push({ ...item, children: filteredChildren });
          }
        } else {
          // Leaf node
          acc.push(item);
        }
        return acc;
      }, []);
    };

    return filterItems(structure);
  };

  const navItems = getMenuItems();

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-brand-row">
            <div className="brand-container">
              {/* 3D Logo Icon - Static Vector */}
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="brand-icon">
              <defs>
                <linearGradient id="goldSphereStatic" x1="10" y1="10" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="#FCD34D" />
                  <stop offset="1" stopColor="#B45309" />
                </linearGradient>
                <linearGradient id="blueOrbitStatic" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="#60A5FA" />
                  <stop offset="1" stopColor="#1E40AF" />
                </linearGradient>
              </defs>

              {/* Gold Sphere Base */}
              <circle cx="16" cy="16" r="8" fill="url(#goldSphereStatic)" />

              {/* Orbital Segment 1 - Top Right */}
              <path d="M16 6C19.5 6 22.5 7.5 24.5 10" stroke="url(#blueOrbitStatic)" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />

              {/* Orbital Segment 2 - Bottom Left */}
              <path d="M16 26C12.5 26 9.5 24.5 7.5 22" stroke="url(#blueOrbitStatic)" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />

              {/* Orbital Ring - Diagonal */}
              <ellipse cx="16" cy="16" rx="11" ry="4" transform="rotate(-45 16 16)" stroke="url(#blueOrbitStatic)" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
              </svg>

              {/* Brand Text */}
              <div className="brand-text">
                <span className="brand-gkt">GKT</span>
                <span className="brand-separator">–</span>
                <span className="brand-crm">CRM</span>
              </div>
            </div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {navItems.filter(item => !['Profile', 'Settings'].includes(item.label)).map(item => {
            if (item.children) {
              const isExpanded = expandedMenus[item.label];
              const isActive = item.children.some(child => location.pathname === child.path);

              return (
                <div key={item.label} className="nav-group">
                  <div
                    className={`nav-parent ${isActive ? 'active-parent' : ''}`}
                    onClick={() => toggleMenu(item.label)}
                  >
                    <span className="nav-row">
                      <SidebarIcon name={getIconName(item)} />
                      <span className="nav-label">{item.label}</span>
                    </span>
                    <svg
                      className={`nav-arrow ${isExpanded ? 'expanded' : ''}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                  {isExpanded && (
                    <div className="nav-children">
                      {item.children.map(child => (
                        <Link
                          key={child.path}
                          to={child.path}
                          className={`nav-item child-item ${location.pathname === child.path ? 'active' : ''}`}
                        >
                          <span className="nav-row">
                            <SidebarIcon name={getIconName(child)} />
                            <span className="nav-label">{child.label}</span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              >
                <span className="nav-row">
                  <SidebarIcon name={getIconName(item)} />
                  <span className="nav-label">{item.label}</span>
                </span>
              </Link>
            );
          })}
          <button
            type="button"
            className={downloadsOpen ? 'nav-item active' : 'nav-item'}
            onClick={() => setDownloadsOpen((v) => !v)}
          >
            <span className="nav-row">
              <SidebarIcon name="downloads" />
              <span className="nav-label">Downloads</span>
              {downloadsCount > 0 && <span className="nav-badge">{downloadsCount}</span>}
            </span>
          </button>
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <Link to="/profile" className="sidebar-user-main">
              <div className="sidebar-user-avatar" aria-label="Profile">
                {user?.avatarDataUrl ? (
                  <img src={user.avatarDataUrl} alt="Profile" className="sidebar-user-avatar-img" />
                ) : (
                  <span className="sidebar-user-avatar-text">{userInitials}</span>
                )}
              </div>
              <div className="sidebar-user-meta">
                <div className="sidebar-user-name" title={user?.name || ''}>{user?.name || 'User'}</div>
                <div className="sidebar-user-role" title={user?.role || ''}>{user?.role || ''}</div>
              </div>
            </Link>
          </div>

          <div className="sidebar-footer-links">
            {navItems.filter(item => ['Profile', 'Settings'].includes(item.label)).map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item sidebar-footer-item ${location.pathname === item.path ? 'active' : ''}`}
              >
                <span className="nav-row">
                  <SidebarIcon name={getIconName(item)} />
                  <span className="nav-label">{item.label}</span>
                </span>
              </Link>
            ))}
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <svg
              className="logout-icon"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points="16 17 21 12 16 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <line
                x1="21"
                y1="12"
                x2="9"
                y2="12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </aside>

      <main className="main-content">
        {downloadsOpen && (
          <div className="downloads-panel" role="dialog" aria-modal="true">
            <div className="downloads-panel-header">
              <div className="downloads-panel-title">Downloads</div>
              <button className="downloads-panel-close" type="button" onClick={() => setDownloadsOpen(false)}>
                ×
              </button>
            </div>

            {downloadsCount > 0 ? (
              <div className="downloads-panel-body">
                {user.downloads.map((d) => (
                  <div
                    className={`downloads-item ${deletingDownloadIds.has(String(d._id)) ? 'is-deleting' : ''}`}
                    key={d._id || `${d.title}-${d.createdAt}`}
                  >
                    <div className="downloads-item-main">
                      <div className="downloads-item-title">{d.title || 'Download'}</div>
                      <div className="downloads-item-sub">
                        <span>{d.type || 'N/A'}</span>
                        <span>•</span>
                        <span>{d.createdAt ? new Date(d.createdAt).toLocaleString() : 'N/A'}</span>
                      </div>
                    </div>
                    <div className="downloads-item-actions">
                      <button type="button" className="view-btn" onClick={() => openDownload(d)}>
                        Open
                      </button>
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => deleteDownload(d._id)}
                        aria-label="Delete"
                        title="Delete"
                      >
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18" />
                          <path d="M8 6V4h8v2" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="downloads-panel-empty">No downloads yet.</div>
            )}
          </div>
        )}
        {location.pathname !== '/' && (
          <div className="back-to-dashboard-container">
            <Link to="/" className="back-to-dashboard-btn">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Back to Dashboard
            </Link>
          </div>
        )}
        {children}
      </main>
    </div>
  );
};

export default Layout;
