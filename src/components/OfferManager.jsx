import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Plus, DollarSign } from 'lucide-react';
import { API_URL } from '../config.js';

const STATUS_MAP = {
  draft: { label: 'ร่าง', color: 'var(--text-muted)' },
  sent: { label: 'ส่งแล้ว', color: 'var(--warning)' },
  accepted: { label: 'ตอบรับ', color: 'var(--success)' },
  rejected: { label: 'ปฏิเสธ', color: '#ef4444' },
};

const OfferManager = ({ job, user }) => {
  const [offers, setOffers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ candidateId: '', salary: '', position: '', startDate: '', notes: '' });

  const fetchOffers = async () => {
    if (!job?.id) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/offers?jobId=${job.id}`, {
      headers: { 'Authorization': `Bearer ${token}` },
      credentials: 'include',
    });
    if (res.ok) setOffers(await res.json());
  };

  useEffect(() => {
    let isMounted = true;
    const loadOffers = async () => {
      if (!job?.id) return;
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/offers?jobId=${job.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include',
      });
      if (res.ok && isMounted) setOffers(await res.json());
    };
    loadOffers();
    return () => { isMounted = false; };
  }, [job?.id]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/offers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      credentials: 'include',
      body: JSON.stringify({ ...form, jobId: job.id }),
    });
    if (res.ok) { fetchOffers(); setShowForm(false); setForm({ candidateId: '', salary: '', position: '', startDate: '', notes: '' }); }
  };

  const updateStatus = async (id, status) => {
    const token = localStorage.getItem('token');
    await fetch(`${API_URL}/offers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    fetchOffers();
  };

  const canEdit = ['ADMIN', 'HR_MANAGER'].includes(user?.role);

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ color: 'var(--text-primary)' }}>📋 ข้อเสนองาน ({offers.length})</h3>
        {canEdit && (
          <button className="btn btn-glow" onClick={() => setShowForm(!showForm)}>
            <Plus size={14} /> สร้างข้อเสนอ
          </button>
        )}
      </div>

      {showForm && (
        <div className="glass-panel-static" style={{ padding: '1rem', marginBottom: '1rem' }}>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="input-label mb-2 block">Candidate ID</label>
              <input className="input-field w-full" placeholder="CAND-001" value={form.candidateId} onChange={e => setForm(p => ({ ...p, candidateId: e.target.value }))} required />
            </div>
            <div>
              <label className="input-label mb-2 block">ตำแหน่ง</label>
              <input className="input-field w-full" placeholder="Senior React Developer" value={form.position} onChange={e => setForm(p => ({ ...p, position: e.target.value }))} />
            </div>
            <div>
              <label className="input-label mb-2 block">เงินเดือน</label>
              <input className="input-field w-full" placeholder="50,000 THB/month" value={form.salary} onChange={e => setForm(p => ({ ...p, salary: e.target.value }))} />
            </div>
            <div>
              <label className="input-label mb-2 block">วันเริ่มงาน</label>
              <input type="date" className="input-field w-full" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label className="input-label mb-2 block">หมายเหตุ</label>
              <textarea className="input-field w-full" rows="2" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <button type="submit" className="btn btn-glow">สร้างข้อเสนอ</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {offers.length === 0 && <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>ยังไม่มีข้อเสนองาน</div>}
        {offers.map(offer => (
          <div key={offer.id} className="glass-panel-static" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{offer.candidate.name}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  {offer.position && <span>{offer.position} · </span>}
                  {offer.salary && <span><DollarSign size={12} /> {offer.salary}</span>}
                  {offer.startDate && <span> · เริ่ม {new Date(offer.startDate).toLocaleDateString('th-TH')}</span>}
                </div>
                {offer.notes && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>{offer.notes}</div>}
              </div>
              <span style={{
                padding: '0.2rem 0.75rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                background: `${STATUS_MAP[offer.status]?.color}20`, color: STATUS_MAP[offer.status]?.color,
              }}>
                {STATUS_MAP[offer.status]?.label || offer.status}
              </span>
            </div>

            {canEdit && offer.status === 'sent' && (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button className="btn btn-secondary" style={{ fontSize: '0.75rem' }} onClick={() => updateStatus(offer.id, 'accepted')}>
                  <CheckCircle size={12} /> ตอบรับ
                </button>
                <button className="btn btn-secondary" style={{ fontSize: '0.75rem', color: '#ef4444' }} onClick={() => updateStatus(offer.id, 'rejected')}>
                  <XCircle size={12} /> ปฏิเสธ
                </button>
              </div>
            )}
            {canEdit && offer.status === 'draft' && (
              <button className="btn btn-secondary" style={{ fontSize: '0.75rem', marginTop: '0.5rem' }} onClick={() => updateStatus(offer.id, 'sent')}>
                ส่งข้อเสนอ
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default OfferManager;
