import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, ShieldCheck, Sparkles, Building2, UserCheck, CheckCircle2 } from 'lucide-react';
import { API_URL } from '../config.js';

const DEMO_ACCOUNTS = [
  { role: 'HR Manager', email: 'hr@example.com', password: 'HrPass123!', badge: 'แนะนำสำหรับทดสอบ' },
  { role: 'Admin', email: 'admin@example.com', password: 'Admin123!', badge: 'สิทธิ์สูงสุด' },
  { role: 'Interviewer', email: 'interviewer@example.com', password: 'Interview1!', badge: 'ผู้สัมภาษณ์' },
];

const Login = ({ onLogin, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const performLogin = async (loginEmail, loginPass) => {
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'เข้าสู่ระบบไม่สำเร็จ');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err) {
      setError(err.message === 'Invalid credentials' ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' : err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    performLogin(email, password);
  };

  const handleDemoLogin = (demo) => {
    setEmail(demo.email);
    setPassword(demo.password);
    performLogin(demo.email, demo.password);
  };

  return (
    <div className="enterprise-auth-container">
      {/* ── Left Hero / Enterprise Value Proposition ── */}
      <div className="auth-hero-panel">
        <div className="hero-brand">
          <div className="hero-logo-box">
            <Sparkles size={22} className="text-white" />
          </div>
          <span className="hero-brand-name">TALENT CLOUD AI</span>
        </div>

        <div className="hero-main-copy">
          <span className="hero-tag">Enterprise Recruitment Platform</span>
          <h1 className="hero-headline">
            ระบบสรรหาและคัดกรองบุคลากรอัจฉริยะ ระดับองค์กร
          </h1>
          <p className="hero-subtext">
            เพิ่มความแม่นยำในการคัดเลือกผู้สมัครด้วยโมเดล LLM ภาษาไทยชั้นนำ พร้อมระบบ Talent Pipeline, Interview Scheduler และ Offer Workflow แบบครบวงจร
          </p>

          <div className="hero-features-list">
            <div className="hero-feature-item">
              <CheckCircle2 size={18} className="text-emerald-400" />
              <span>AI Multi-dimension Match Scoring & Skill Gap Analysis</span>
            </div>
            <div className="hero-feature-item">
              <CheckCircle2 size={18} className="text-emerald-400" />
              <span>End-to-End Recruitment Pipeline & Kanban Board</span>
            </div>
            <div className="hero-feature-item">
              <CheckCircle2 size={18} className="text-emerald-400" />
              <span>Role-Based Access Control (RBAC) & Enterprise Security</span>
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
            <h2 className="auth-title">ลงชื่อเข้าใช้งาน</h2>
            <p className="auth-subtitle">เข้าสู่ระบบจัดการและบริหารทรัพยากรบุคคล</p>
          </div>

          {error && <div className="enterprise-alert-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form-inputs">
            <div className="form-group">
              <label className="form-label">อีเมลองค์กร (Corporate Email)</label>
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={loading}
            >
              {loading ? 'กำลังตรวจสอบสิทธิ์...' : (
                <>
                  <span>เข้าสู่ระบบ</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* 1-Click Demo Switcher */}
          <div className="demo-accounts-box">
            <div className="demo-header">
              <UserCheck size={14} />
              <span>เข้าสู่ระบบด่วนด้วยบัญชีทดสอบ (Demo Accounts)</span>
            </div>
            <div className="demo-buttons-grid">
              {DEMO_ACCOUNTS.map((demo, i) => (
                <button
                  key={i}
                  type="button"
                  className="btn-demo-item"
                  onClick={() => handleDemoLogin(demo)}
                  disabled={loading}
                >
                  <span className="demo-role">{demo.role}</span>
                  <span className="demo-badge">{demo.badge}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="auth-switch-prompt">
            ยังไม่มีบัญชีองค์กร?{' '}
            <button type="button" className="btn-link" onClick={onSwitchToRegister}>
              ลงทะเบียนใหม่
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
