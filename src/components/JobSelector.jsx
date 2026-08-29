import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, ChevronDown, MapPin, Building2 } from 'lucide-react';
import { API_URL } from '../config.js';

const JobSelector = ({ selectedJob, setSelectedJob, user, refreshTrigger }) => {
  const [jobs, setJobs] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', department: '', location: '', employmentType: 'Full-time', salaryRange: '' });
  const [loading, setLoading] = useState(false);

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/jobs`, {
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
        if (!selectedJob && data.length > 0) {
          setSelectedJob(data[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
    }
  };

  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const newJob = await res.json();
        setJobs(prev => [newJob, ...prev]);
        setSelectedJob(newJob);
        setShowCreate(false);
        setForm({ title: '', description: '', department: '', location: '', employmentType: 'Full-time', salaryRange: '' });
      }
    } catch (err) {
      console.error('Error creating job:', err);
    } finally {
      setLoading(false);
    }
  };

  const canCreate = ['ADMIN', 'HR_MANAGER'].includes(user?.role);

  return (
    <div style={{ position: 'relative' }}>
      {/* Current Job Button */}
      <button
        className="sidebar-item"
        onClick={() => setShowDropdown(!showDropdown)}
        style={{ width: '100%', justifyContent: 'space-between' }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Briefcase size={16} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>
            {selectedJob?.title || 'เลือกงาน'}
          </span>
        </span>
        <ChevronDown size={14} style={{ transform: showDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: 'var(--bg-secondary)', border: '1px solid var(--border)',
          borderRadius: '8px', padding: '0.5rem', zIndex: 100,
          maxHeight: '300px', overflowY: 'auto', marginTop: '4px',
        }}>
          {jobs.map(job => (
            <button
              key={job.id}
              onClick={() => { setSelectedJob(job); setShowDropdown(false); }}
              style={{
                display: 'flex', flexDirection: 'column', gap: '0.15rem',
                width: '100%', padding: '0.6rem 0.75rem', border: 'none',
                background: selectedJob?.id === job.id ? 'var(--accent-muted)' : 'transparent',
                color: 'var(--text-primary)', borderRadius: '6px', cursor: 'pointer',
                textAlign: 'left', fontSize: '0.85rem',
              }}
            >
              <span style={{ fontWeight: 600 }}>{job.title}</span>
              <span style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {job.department && <span><Building2 size={10} /> {job.department}</span>}
                {job.location && <span><MapPin size={10} /> {job.location}</span>}
                <span>{job._count?.jobCandidates || 0} คน</span>
              </span>
            </button>
          ))}

          {canCreate && (
            <button
              onClick={() => { setShowCreate(true); setShowDropdown(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                width: '100%', padding: '0.6rem 0.75rem', border: '1px dashed var(--border)',
                background: 'transparent', color: 'var(--accent)', borderRadius: '6px',
                cursor: 'pointer', fontSize: '0.85rem', marginTop: '0.25rem',
              }}
            >
              <Plus size={14} /> สร้างประกาศงานใหม่
            </button>
          )}
        </div>
      )}

      {/* Create Job Modal */}
      {showCreate && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
        }} onClick={() => setShowCreate(false)}>
          <div className="auth-card" style={{ maxWidth: '500px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <h3 className="text-gradient" style={{ marginBottom: '1rem' }}>สร้างประกาศงานใหม่</h3>
            <form onSubmit={handleCreate} className="auth-form">
              <div>
                <label className="input-label mb-2 block">ชื่อตำแหน่ง *</label>
                <input className="input-field w-full" placeholder="เช่น Senior React Developer" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="input-label mb-2 block">แผนก</label>
                  <input className="input-field w-full" placeholder="Engineering" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} />
                </div>
                <div>
                  <label className="input-label mb-2 block">สถานที่</label>
                  <input className="input-field w-full" placeholder="Bangkok / Remote" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="input-label mb-2 block">ประเภทการจ้างงาน</label>
                  <select className="input-field w-full" value={form.employmentType} onChange={e => setForm(p => ({ ...p, employmentType: e.target.value }))}>
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract</option>
                    <option>Freelance</option>
                  </select>
                </div>
                <div>
                  <label className="input-label mb-2 block">เงินเดือน</label>
                  <input className="input-field w-full" placeholder="40,000 - 60,000" value={form.salaryRange} onChange={e => setForm(p => ({ ...p, salaryRange: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="input-label mb-2 block">รายละเอียดงาน</label>
                <textarea className="input-field w-full" rows="3" placeholder="อธิบายคุณสมบัติที่ต้องการ..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>ยกเลิก</button>
                <button type="submit" className="btn btn-glow" disabled={loading}>{loading ? 'กำลังสร้าง...' : 'สร้างงาน'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobSelector;
