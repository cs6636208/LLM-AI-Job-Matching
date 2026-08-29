import React, { useState } from 'react';
import { User, Lock, Mail, ShieldCheck, ArrowRight, Building2, CheckCircle2 } from 'lucide-react';
import { API_URL } from '../config.js';

const Register = ({ onSwitchToLogin, onLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  const passwordChecks = [
    { label: 'ความยาว 8 ตัวอักษรขึ้นไป', test: (p) => p.length >= 8 },
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
    <div className="enterprise-auth-container">
      {/* ── Left Hero Panel ── */}
      <div className="auth-hero-panel">
        <div className="hero-brand">
          <div className="hero-logo-box">
            <ShieldCheck size={22} className="text-white" />
          </div>
          <span className="hero-brand-name">TALENT CLOUD AI</span>
        </div>

        <div className="hero-main-copy">
          <span className="hero-tag">Join Enterprise Recruitment Hub</span>
          <h1 className="hero-headline">
            เริ่มต้นใช้งานระบบคัดกรองบุคลากรด้วย AI วันนี้
          </h1>
          <p className="hero-subtext">
            สร้างบัญชีเพื่อเข้าถึงเครื่องมือคัดกรองผู้สมัครอัจฉริยะ พร้อมแดชบอร์ดบริหารกระบวนการสัมภาษณ์แบบครบวงจร
          </p>

          <div className="hero-features-list">
            <div className="hero-feature-item">
              <CheckCircle2 size={18} className="text-emerald-400" />
              <span>ประเมินเรซูเม่และจัดอันดับด้วย LLM คุณภาพสูง</span>
            </div>
            <div className="hero-feature-item">
              <CheckCircle2 size={18} className="text-emerald-400" />
              <span>บริหารจัดการผู้สมัครในระบบ Kanban Pipeline</span>
            </div>
            <div className="hero-feature-item">
              <CheckCircle2 size={18} className="text-emerald-400" />
              <span>ระบบรักษาความปลอดภัยและการเข้ารหัสตามมาตรฐานองค์กร</span>
            </div>
          </div>
        </div>

        <div className="hero-footer-badge">
          <Building2 size={16} />
          <span>Enterprise Edition · Ver 2.4</span>
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="auth-form-panel">
        <div className="auth-form-inner">
          <div className="auth-header">
            <h2 className="auth-title">สร้างบัญชีผู้ใช้งานใหม่</h2>
            <p className="auth-subtitle">กรอกข้อมูลเพื่อลงทะเบียนเข้าใช้งานในองค์กร</p>
          </div>

          {error && <div className="enterprise-alert-error">{error}</div>}

          {validationErrors.length > 0 && (
            <div className="enterprise-alert-error">
              <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                {validationErrors.map((err, i) => (
                  <li key={i}>{err.field}: {err.message}</li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form-inputs">
            <div className="form-group">
              <label className="form-label">ชื่อ - นามสกุล (Full Name)</label>
              <div className="input-with-icon">
                <User size={16} className="input-icon" />
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="สมชาย ใจดี"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">อีเมลองค์กร (Email)</label>
              <div className="input-with-icon">
                <Mail size={16} className="input-icon" />
                <input
                  type="email"
                  required
                  className="form-control"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">รหัสผ่าน (Password)</label>
              <div className="input-with-icon">
                <Lock size={16} className="input-icon" />
                <input
                  type="password"
                  required
                  className="form-control"
                  placeholder="••••••••"
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {password.length > 0 && (
                <div className="password-checklist mt-2">
                  {passwordChecks.map((check, i) => (
                    <div
                      key={i}
                      className={`password-check-item ${check.test(password) ? 'valid' : 'invalid'}`}
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
              className="btn btn-primary btn-block btn-lg mt-3"
              disabled={loading}
            >
              {loading ? 'กำลังสร้างบัญชี...' : (
                <>
                  <span>ยืนยันการสมัครสมาชิก</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="auth-switch-prompt">
            มีบัญชีผู้ใช้อยู่แล้ว?{' '}
            <button type="button" className="btn-link" onClick={onSwitchToLogin}>
              ลงชื่อเข้าใช้งาน
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
