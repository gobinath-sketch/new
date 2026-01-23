import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login.jsx';
import Dashboard from '../pages/Dashboard.jsx';
import Vendors from '../pages/Vendors.jsx';
import Programs from '../pages/Programs.jsx';
import Materials from '../pages/Materials.jsx';
import Deals from '../pages/Deals.jsx';
import PurchaseOrders from '../pages/PurchaseOrders.jsx';
import Invoices from '../pages/Invoices.jsx';
import Receivables from '../pages/Receivables.jsx';
import Payables from '../pages/Payables.jsx';
import DealRequests from '../pages/DealRequests.jsx';
import GP from '../pages/GP.jsx';
import Governance from '../pages/Governance.jsx';
import Opportunities from '../pages/Opportunities.jsx';
import ClientCreation from '../pages/ClientCreation.jsx';
import OpportunityCreation from '../pages/OpportunityCreation.jsx';
import OpportunityDetail from '../pages/OpportunityDetail.jsx';
import ClientDetail from '../pages/ClientDetail.jsx';
import ProgramDetail from '../pages/ProgramDetail.jsx';
import Profile from '../pages/Profile.jsx';
import Settings from '../pages/Settings.jsx';
import Layout from '../components/Layout.jsx';
import { getAuthToken, getUser } from '../services/auth.js';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      getUser()
        .then(data => {
          setUser(data.user);
        })
        .catch((error) => {
          // Silently handle auth errors - user is not logged in or token is invalid
          localStorage.removeItem('token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={!user ? <Login setUser={setUser} /> : <Navigate to="/" />} />
        <Route path="/" element={user ? <Layout user={user} setUser={setUser}><Dashboard user={user} /></Layout> : <Navigate to="/login" />} />
        <Route path="/vendors" element={user ? <Layout user={user} setUser={setUser}><Vendors user={user} /></Layout> : <Navigate to="/login" />} />
        <Route path="/programs" element={user ? <Layout user={user} setUser={setUser}><Programs user={user} /></Layout> : <Navigate to="/login" />} />
        <Route path="/programs/:id" element={user ? <Layout user={user} setUser={setUser}><ProgramDetail user={user} setUser={setUser} /></Layout> : <Navigate to="/login" />} />
        <Route path="/materials" element={user ? <Layout user={user} setUser={setUser}><Materials user={user} /></Layout> : <Navigate to="/login" />} />
        <Route path="/deals" element={user ? <Layout user={user} setUser={setUser}><Deals user={user} /></Layout> : <Navigate to="/login" />} />
        <Route path="/purchase-orders" element={user ? <Layout user={user} setUser={setUser}><PurchaseOrders user={user} /></Layout> : <Navigate to="/login" />} />
        <Route path="/invoices" element={user ? <Layout user={user} setUser={setUser}><Invoices user={user} /></Layout> : <Navigate to="/login" />} />
        <Route path="/receivables" element={user ? <Layout user={user} setUser={setUser}><Receivables user={user} /></Layout> : <Navigate to="/login" />} />
        <Route path="/payables" element={user ? <Layout user={user} setUser={setUser}><Payables user={user} /></Layout> : <Navigate to="/login" />} />
        <Route path="/deal-requests" element={user ? <Layout user={user} setUser={setUser}><DealRequests user={user} /></Layout> : <Navigate to="/login" />} />
        <Route path="/opportunities" element={user ? <Layout user={user} setUser={setUser}><Opportunities user={user} /></Layout> : <Navigate to="/login" />} />
        <Route path="/opportunities/:id" element={user ? <Layout user={user} setUser={setUser}><OpportunityDetail user={user} /></Layout> : <Navigate to="/login" />} />
        <Route path="/client-creation" element={user ? <Layout user={user} setUser={setUser}><ClientCreation user={user} /></Layout> : <Navigate to="/login" />} />
        <Route path="/clients/:id" element={user ? <Layout user={user} setUser={setUser}><ClientDetail user={user} /></Layout> : <Navigate to="/login" />} />
        <Route path="/opportunity-creation" element={user ? <Layout user={user} setUser={setUser}><OpportunityCreation user={user} /></Layout> : <Navigate to="/login" />} />
        <Route path="/gp" element={user ? <Layout user={user} setUser={setUser}><GP user={user} /></Layout> : <Navigate to="/login" />} />
        <Route path="/governance" element={user ? <Layout user={user} setUser={setUser}><Governance user={user} /></Layout> : <Navigate to="/login" />} />
        <Route path="/profile" element={user ? <Layout user={user} setUser={setUser}><Profile user={user} setUser={setUser} /></Layout> : <Navigate to="/login" />} />
        <Route path="/settings" element={user ? <Layout user={user} setUser={setUser}><Settings user={user} setUser={setUser} /></Layout> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
