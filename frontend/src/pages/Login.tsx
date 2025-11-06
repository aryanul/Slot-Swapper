import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import './Auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-theme-toggle">
        <ThemeToggle />
      </div>
      <div className="auth-wrapper">
        <div className="auth-hero">
          <div className="auth-hero-content">
            <div className="auth-logo-large">
              <h2>SlotSwapper</h2>
              <span className="auth-logo-emoji">✨</span>
            </div>
            <p className="auth-tagline">Swap your time slots with others seamlessly</p>
            <div className="auth-features">
              <div className="auth-feature-item">
                <span className="auth-feature-icon">📅</span>
                <span>Manage your calendar</span>
              </div>
              <div className="auth-feature-item">
                <span className="auth-feature-icon">🔄</span>
                <span>Swap time slots easily</span>
              </div>
              <div className="auth-feature-item">
                <span className="auth-feature-icon">⚡</span>
                <span>Fast and secure</span>
              </div>
            </div>
          </div>
        </div>
        <div className="auth-card">
          <h1>Welcome Back!</h1>
          <p className="auth-subtitle">Login to continue to your account</p>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="auth-link">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
        </div>
      </div>
    </div>
  );
}

