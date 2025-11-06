import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import './Auth.css';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signup(name, email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Signup failed');
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
            <p className="auth-tagline">Join the community and start swapping time slots</p>
            <div className="auth-features">
              <div className="auth-feature-item">
                <span className="auth-feature-icon">🚀</span>
                <span>Get started in minutes</span>
              </div>
              <div className="auth-feature-item">
                <span className="auth-feature-icon">👥</span>
                <span>Connect with others</span>
              </div>
              <div className="auth-feature-item">
                <span className="auth-feature-icon">🔒</span>
                <span>100% secure & private</span>
              </div>
            </div>
          </div>
        </div>
        <div className="auth-card">
          <h1>Create Account</h1>
          <p className="auth-subtitle">Sign up to start swapping slots</p>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
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
              minLength={6}
              required
            />
          </div>
          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Signing up...' : 'Sign up'}
          </button>
        </form>
        <p className="auth-link">
          Already have an account? <Link to="/login">Login</Link>
        </p>
        </div>
      </div>
    </div>
  );
}

