import React, { useState } from 'react';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import { API_URL } from '../config.js';

const Login = ({ onLogin, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // receive httpOnly refresh token cookie
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

  return (
    <div className="auth-card">
      <div className="auth-brand">
        <div className="auth-brand-icon">⚡</div>
        <h2 className="text-gradient">ยินดีต้อนรับกลับมา</h2>
        <p className="text-secondary">เข้าสู่ระบบสรรหาบุคลากรด้วย AI</p>
      </div>

      {error && <div className="auth-error">{error}</div>}

      <form onSubmit={handleSubmit} className="auth-form">
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-glow w-full mt-4"
          style={{ justifyContent: 'center', padding: '0.7rem 1.25rem' }}
          disabled={loading}
        >
          {loading ? 'กำลังตรวจสอบ...' : <><ArrowRight size={16} /> เข้าสู่ระบบ</>}
        </button>
      </form>

      <div className="auth-footer">
        ยังไม่มีบัญชีใช่ไหม?{' '}
        <button onClick={onSwitchToRegister}>สร้างบัญชีใหม่</button>
      </div>
    </div>
  );
};

export default Login;
