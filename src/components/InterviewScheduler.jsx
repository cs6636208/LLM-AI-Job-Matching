import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { API_URL } from '../config.js';

const STATUS_COLORS = {
  SCHEDULED: 'var(--warning)',
  COMPLETED: 'var(--success)',
  CANCELLED: 'var(--text-muted)',
  NO_SHOW: '#ef4444',
};

const InterviewScheduler = ({ job, user }) => {
  const [interviews, setInterviews] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ candidateId: '', interviewerId: '', scheduledAt: '', durationMin: 60, location: '', notes: '' });
  const [loading, setLoading] = useState(false);

  const fetchInterviews = async () => {
    if (!job?.id) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/interviews?jobId=${job.id}`, {
      headers: { 'Authorization': `Bearer ${token}` },
      credentials: 'include',
    });
    if (res.ok) setInterviews(await res.json());
  };

  const fetchUsers = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/auth/users`, {
      headers: { 'Authorization': `Bearer ${token}` },
      credentials: 'include',
    });
    if (res.ok) setUsers(await res.json());
  };

  useEffect(() => {
    fetchInterviews();
    if (user?.role === 'ADMIN' || user?.role === 'HR_MANAGER') fetchUsers();
  }, [job?.id]);

  const handleSchedule = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/interviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        credentials: 'include',
        body: JSON.stringify({ ...form, jobId: job.id }),
      });
      if (res.ok) {
        fetchInterviews();
        setShowForm(false);
        setForm({ candidateId: '', interviewerId: '', scheduledAt: '', durationMin: 60, location: '', notes: '' });
      }
    } finally { setLoading(false); }
  };

  const updateStatus = async (id, status) => {
    const token = localStorage.getItem('token');
    await fetch(`${API_URL}/interviews/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    fetchInterviews();
  };

  const canEdit = ['ADMIN', 'HR_MANAGER'].includes(user?.role);

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ color: 'var(--text-primary)' }}>📅 นัดสัมภาษณ์ ({interviews.length})</h3>
        {canEdit && (
          <button className="btn btn-glow" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'ยกเลิก' : '+ นัดสัมภาษณ์ใหม่'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="glass-panel-static" style={{ padding: '1rem', marginBottom: '1rem' }}>
          <form onSubmit={handleSchedule} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="input-label mb-2 block">ผู้สมัคร (Candidate ID)</label>
              <input className="input-field w-full" placeholder="CAND-001" value={form.candidateId} onChange={e => setForm(p => ({ ...p, candidateId: e.target.value }))} required />
            </div>
            <div>
              <label className="input-label mb-2 block">ผู้สัมภาษณ์</label>
              <select className="input-field w-full" value={form.interviewerId} onChange={e => setForm(p => ({ ...p, interviewerId: e.target.value }))} required>
                <option value="">-- เลือก --</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label mb-2 block">วันเวลา</label>
              <input type="datetime-local" className="input-field w-full" value={form.scheduledAt} onChange={e => setForm(p => ({ ...p, scheduledAt: e.target.value }))} required />
            </div>
            <div>
              <label className="input-label mb-2 block">ระยะเวลา (นาที)</label>
              <input type="number" className="input-field w-full" value={form.durationMin} onChange={e => setForm(p => ({ ...p, durationMin: Number(e.target.value) }))} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label className="input-label mb-2 block">สถานที่ / ลิงก์</label>
              <input className="input-field w-full" placeholder="Google Meet link หรือ ห้องประชุม 3" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <button type="submit" className="btn btn-glow" disabled={loading}>{loading ? 'กำลังนัด...' : 'นัดสัมภาษณ์'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Interview List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {interviews.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>ยังไม่มีนัดสัมภาษณ์</div>
        )}
        {interviews.map(interview => (
          <div key={interview.id} className="glass-panel-static" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  {interview.candidate.name}
                </div>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <span><User size={12} /> {interview.interviewer.name}</span>
                  <span><Calendar size={12} /> {new Date(interview.scheduledAt).toLocaleString('th-TH')}</span>
                  <span><Clock size={12} /> {interview.durationMin} นาที</span>
                  {interview.location && <span><MapPin size={12} /> {interview.location}</span>}
                </div>
              </div>
              <span style={{
                padding: '0.2rem 0.75rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                background: `${STATUS_COLORS[interview.status]}20`, color: STATUS_COLORS[interview.status],
              }}>
                {interview.status}
              </span>
            </div>

            {canEdit && interview.status === 'SCHEDULED' && (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
                  onClick={() => updateStatus(interview.id, 'COMPLETED')}>
                  <CheckCircle size={12} /> เสร็จสิ้น
                </button>
                <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', color: '#ef4444' }}
                  onClick={() => updateStatus(interview.id, 'NO_SHOW')}>
                  <XCircle size={12} /> ไม่มา
                </button>
                <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
                  onClick={() => updateStatus(interview.id, 'CANCELLED')}>
                  <AlertCircle size={12} /> ยกเลิก
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default InterviewScheduler;
