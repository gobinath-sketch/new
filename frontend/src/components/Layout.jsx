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

  const getMenuItems = () => {
    const role = user?.role;
    const subRole = user?.subRole;

    const allItems = [
      {
        path: '/',
        label: 'Dashboard',
        roles: ['Operations Manager', 'Business Head', 'Finance Manager', 'Director', 'Sales Executive', 'Sales Manager'],
        subRoles: null // All sub-roles can access dashboard
      },
      {
        path: '/client-creation',
        label: 'Create Client',
        roles: ['Sales Executive', 'Sales Manager', 'Director'],
        subRoles: null
      },
      {
        path: '/opportunity-creation',
        label: 'Create Opportunity',
        roles: ['Sales Executive', 'Sales Manager'],
        subRoles: null
      },
      {
        path: '/opportunities',
        label: 'Opportunities',
        roles: ['Business Head', 'Director', 'Sales Executive', 'Sales Manager', 'Operations Manager', 'Finance Manager'],
        subRoles: null
      },
      {
        path: '/vendors',
        label: 'Vendors',
        roles: ['Operations Manager', 'Finance Manager', 'Director'],
        subRoles: null
      },
      {
        path: '/programs',
        label: 'Programs',
        roles: ['Operations Manager'],
        subRoles: null
      },
      {
        path: '/materials',
        label: 'Materials',
        roles: ['Finance Manager'],
        subRoles: null
      },
      {
        path: '/purchase-orders',
        label: 'Purchase Orders',
        roles: ['Operations Manager', 'Finance Manager'],
        subRoles: null
      },
      {
        path: '/invoices',
        label: 'Invoices',
        roles: ['Finance Manager', 'Director'],
        subRoles: null
      },
      {
        path: '/receivables',
        label: 'Receivables',
        roles: ['Finance Manager', 'Director'],
        subRoles: null
      },
      {
        path: '/payables',
        label: 'Payables',
        roles: ['Finance Manager', 'Director'],
        subRoles: null
      },
      {
        path: '/tax-engine',
        label: 'Tax Engine',
        roles: ['Finance Manager', 'Director'],
        subRoles: null
      },
      {
        path: '/governance',
        label: 'Governance',
        roles: ['Director'],
        subRoles: null
      },
      {
        path: '/profile',
        label: 'Profile',
        roles: ['Operations Manager', 'Business Head', 'Finance Manager', 'Director', 'Sales Executive', 'Sales Manager'],
        subRoles: null
      },
      {
        path: '/settings',
        label: 'Settings',
        roles: ['Operations Manager', 'Business Head', 'Finance Manager', 'Director', 'Sales Executive', 'Sales Manager'],
        subRoles: null
      }
    ];

    return allItems.filter(item => {
      // Check role first
      if (!item.roles.includes(role)) {
        // If role is Business Head with subRole, also check if subRole would grant access
        if (role === 'Business Head' && subRole) {
          // Sales Executive and Sales Manager should have the same access
          // If either subRole would have access, grant it to both
          const subRoleMap = {
            'SalesExecutive': 'Sales Executive',
            'SalesManager': 'Sales Manager'
          };
          const mappedSubRole = subRoleMap[subRole];
          if (mappedSubRole && item.roles.includes(mappedSubRole)) {
            return true;
          }
        }
        return false;
      }
      // If Business Head with subRole, ensure Sales Executive and Sales Manager get same access
      if (role === 'Business Head' && subRole) {
        // Both Sales Executive and Sales Manager should see the same menu items
        // This ensures Sales Executive gets everything Sales Manager has
        if (subRole === 'SalesExecutive' || subRole === 'SalesManager') {
          // If Sales Manager has access, Sales Executive should too (and vice versa)
          const hasSalesManagerAccess = item.roles.includes('Sales Manager');
          const hasSalesExecutiveAccess = item.roles.includes('Sales Executive');
          if (hasSalesManagerAccess || hasSalesExecutiveAccess) {
            return true;
          }
        }
      }
      return true;
    });
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-title">Single Playground ERP</h1>
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-role">
              {user?.role}
              {user?.subRole && ` (${user.subRole === 'SalesExecutive' ? 'Sales Executive' : 'Sales Manager'})`}
            </div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {getMenuItems().filter(item => !['Profile', 'Settings'].includes(item.label)).map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          {getMenuItems().filter(item => ['Profile', 'Settings'].includes(item.label)).map(item => (
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
        {children}
      </main>
    </div>
  );
};

export default Layout;
