import React, { useState } from 'react';
import { User, Lock, Mail, ShieldCheck, Info } from 'lucide-react';
import { API_URL } from '../config.js';

const Register = ({ onRegisterSuccess, onSwitchToLogin, onLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  const passwordChecks = [
    { label: 'อย่างน้อย 8 ตัวอักษร', test: (p) => p.length >= 8 },
    { label: 'มีตัวพิมพ์ใหญ่ (A-Z)', test: (p) => /[A-Z]/.test(p) },
    { label: 'มีตัวพิมพ์เล็ก (a-z)', test: (p) => /[a-z]/.test(p) },
    { label: 'มีตัวเลข (0-9)', test: (p) => /[0-9]/.test(p) },
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
          throw new Error(data.error || 'ลงทะเบียนไม่สำเร็จ');
        }
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err) {
      setError(err.message === 'User already exists' ? 'มีอีเมลนี้ในระบบแล้ว' : err.message);
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
        <h2 className="text-gradient">สร้างบัญชีใหม่</h2>
        <p className="text-secondary">เข้าร่วมแพลตฟอร์มสรรหาด้วย AI</p>
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
          <label className="input-label mb-2 block">ชื่อ - นามสกุล</label>
          <div className="auth-input-wrap">
            <User size={16} className="auth-input-icon" />
            <input
              type="text"
              required
              className="input-field"
              placeholder="สมชาย ใจดี"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="input-label mb-2 block">อีเมล</label>
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
          <label className="input-label mb-2 block">รหัสผ่าน</label>
          <div className="auth-input-wrap">
            <Lock size={16} className="auth-input-icon" />
            <input
              type="password"
              required
              className="input-field"
              placeholder="••••••••"
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
                  <span>{check.test(password) ? '✓' : '○'}</span>
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
          {loading ? 'กำลังสร้างบัญชี...' : 'สมัครสมาชิก'}
        </button>
      </form>

      <div className="auth-footer">
        มีบัญชีอยู่แล้ว?{' '}
        <button onClick={onSwitchToLogin}>เข้าสู่ระบบ</button>
      </div>
    </div>
  );
};

export default Register;
