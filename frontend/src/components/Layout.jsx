import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { removeAuthToken } from '../services/auth';
import './Layout.css';


const Layout = ({ children, user, setUser }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    removeAuthToken();
    setUser(null);
    navigate('/login');
  };

  const [expandedMenus, setExpandedMenus] = useState({ Finance: true });

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
                    <span>{item.label}</span>
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
                          {child.label}
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
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          {navItems.filter(item => ['Profile', 'Settings'].includes(item.label)).map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item sidebar-footer-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
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
