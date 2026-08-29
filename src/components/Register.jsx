import React, { useState } from 'react';
import { User, Lock, Mail, ShieldCheck } from 'lucide-react';
import { API_URL } from '../config.js';

const Register = ({ onSwitchToLogin, onLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  const passwordChecks = [
    { label: 'เธญเธขเนเธฒเธเธเนเธญเธข 8 เธ•เธฑเธงเธญเธฑเธเธฉเธฃ', test: (p) => p.length >= 8 },
    { label: 'เธกเธตเธ•เธฑเธงเธเธดเธกเธเนเนเธซเธเน (A-Z)', test: (p) => /[A-Z]/.test(p) },
    { label: 'เธกเธตเธ•เธฑเธงเธเธดเธกเธเนเน€เธฅเนเธ (a-z)', test: (p) => /[a-z]/.test(p) },
    { label: 'เธกเธตเธ•เธฑเธงเน€เธฅเธ (0-9)', test: (p) => /[0-9]/.test(p) },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setValidationErrors([]);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          setValidationErrors(data.details);
        } else {
          throw new Error(data.error || 'เธฅเธเธ—เธฐเน€เธเธตเธขเธเนเธกเนเธชเธณเน€เธฃเนเธ');
        }
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err) {
      setError(err.message === 'User already exists' ? 'เธกเธตเธญเธตเน€เธกเธฅเธเธตเนเนเธเธฃเธฐเธเธเนเธฅเนเธง' : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-brand">
        <div className="auth-brand-icon">
          <ShieldCheck size={24} style={{ color: 'var(--cyan)' }} />
        </div>
        <h2 className="text-gradient">เธชเธฃเนเธฒเธเธเธฑเธเธเธตเนเธซเธกเน</h2>
        <p className="text-secondary">เน€เธเนเธฒเธฃเนเธงเธกเนเธเธฅเธ•เธเธญเธฃเนเธกเธชเธฃเธฃเธซเธฒเธ”เนเธงเธข AI</p>
      </div>

      {error && <div className="auth-error">{error}</div>}

      {validationErrors.length > 0 && (
        <div className="auth-error">
          <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
            {validationErrors.map((err, i) => (
              <li key={i}>{err.field}: {err.message}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form">
        <div>
          <label className="input-label mb-2 block">เธเธทเนเธญ - เธเธฒเธกเธชเธเธธเธฅ</label>
          <div className="auth-input-wrap">
            <User size={16} className="auth-input-icon" />
            <input
              type="text"
              required
              className="input-field"
              placeholder="เธชเธกเธเธฒเธข เนเธเธ”เธต"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="input-label mb-2 block">เธญเธตเน€เธกเธฅ</label>
          <div className="auth-input-wrap">
            <Mail size={16} className="auth-input-icon" />
            <input
              type="email"
              required
              className="input-field"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="input-label mb-2 block">เธฃเธซเธฑเธชเธเนเธฒเธ</label>
          <div className="auth-input-wrap">
            <Lock size={16} className="auth-input-icon" />
            <input
              type="password"
              required
              className="input-field"
              placeholder="โ€ขโ€ขโ€ขโ€ขโ€ขโ€ขโ€ขโ€ข"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {password.length > 0 && (
            <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              {passwordChecks.map((check, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.75rem',
                    color: check.test(password) ? 'var(--success)' : 'var(--text-muted)',
                  }}
                >
                  <span>{check.test(password) ? 'โ“' : 'โ—'}</span>
                  <span>{check.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-glow w-full mt-4"
          style={{ justifyContent: 'center', padding: '0.7rem 1.25rem' }}
          disabled={loading}
        >
          {loading ? 'เธเธณเธฅเธฑเธเธชเธฃเนเธฒเธเธเธฑเธเธเธต...' : 'เธชเธกเธฑเธเธฃเธชเธกเธฒเธเธดเธ'}
        </button>
      </form>

      <div className="auth-footer">
        เธกเธตเธเธฑเธเธเธตเธญเธขเธนเนเนเธฅเนเธง?{' '}
        <button onClick={onSwitchToLogin}>เน€เธเนเธฒเธชเธนเนเธฃเธฐเธเธ</button>
      </div>
    </div>
  );
};

export default Register;
