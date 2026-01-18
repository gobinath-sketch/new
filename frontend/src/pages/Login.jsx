import { useState } from 'react';
import { login } from '../services/auth';
import './Login.css';

const Login = ({ setUser }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await login(formData.email, formData.password);
            setUser(data.user);
        } catch (err) {
            const msg = err.response?.data?.error;
            if (msg && msg.toLowerCase().includes('credential')) {
                setError('Invalid credentials. Please try again.');
            } else {
                setError('Unable to sign in. Please verify your details.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            {/* Left Section: Cover / Branding */}
            <div className="login-visual">
                <div className="visual-overlay"></div>
            </div>

            {/* Right Section: Login Card */}
            <div className="login-content">

                {/* 3D Dark Card Implementation */}
                <form className="form" onSubmit={handleSubmit}>
                    <div className="form_front">
                        <div className="form_details">Login</div>

                        <input
                            placeholder="Username"
                            className="input"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />

                        <input
                            placeholder="Password"
                            className="input"
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                        />

                        {error && (
                            <div className="error-message" style={{ width: '245px', marginTop: '10px' }}>
                                {error}
                            </div>
                        )}

                        <button className="btn" type="submit" disabled={loading}>
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </div>
                </form>

                <footer className="login-footer">
                    &copy; {new Date().getFullYear()} Global Knowledge. All rights reserved.
                </footer>
            </div>
        </div>
    );
}

export default Login;
