import React, { useState, useEffect } from 'react';
import { Mail, Send, Plus, Trash2 } from 'lucide-react';
import { API_URL } from '../config.js';

const EmailManager = ({ job, user }) => {
  const [templates, setTemplates] = useState([]);
  const [sentEmails, setSentEmails] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'CUSTOM', subject: '', body: '' });
  const [sendForm, setSendForm] = useState({ toEmail: '', subject: '', body: '', templateId: null });
  const [showSend, setShowSend] = useState(false);

  const fetchTemplates = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/emails/templates`, {
      headers: { 'Authorization': `Bearer ${token}` },
      credentials: 'include',
    });
    if (res.ok) setTemplates(await res.json());
  };

  const fetchSent = async () => {
    if (!job?.id) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/emails/sent?jobId=${job.id}`, {
      headers: { 'Authorization': `Bearer ${token}` },
      credentials: 'include',
    });
    if (res.ok) setSentEmails(await res.json());
  };

  useEffect(() => { fetchTemplates(); fetchSent(); }, [job?.id]);

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/emails/templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      credentials: 'include',
      body: JSON.stringify(form),
    });
    if (res.ok) { fetchTemplates(); setShowForm(false); setForm({ name: '', type: 'CUSTOM', subject: '', body: '' }); }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/emails/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      credentials: 'include',
      body: JSON.stringify({ ...sendForm, jobId: job?.id }),
    });
    if (res.ok) { fetchSent(); setShowSend(false); setSendForm({ toEmail: '', subject: '', body: '', templateId: null }); }
  };

  const applyTemplate = (template) => {
    setSendForm(p => ({ ...p, subject: template.subject, body: template.body, templateId: template.id }));
    setShowSend(true);
  };

  const canEdit = ['ADMIN', 'HR_MANAGER'].includes(user?.role);

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ color: 'var(--text-primary)' }}>📧 อีเมล</h3>
        {canEdit && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={() => setShowForm(!showForm)}>
              <Plus size={14} /> แม่แบบ
            </button>
            <button className="btn btn-glow" onClick={() => setShowSend(!showSend)}>
              <Send size={14} /> ส่งอีเมล
            </button>
          </div>
        )}
      </div>

      {/* Templates */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>แม่แบบอีเมล</h4>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {templates.map(t => (
            <button key={t.id} onClick={() => applyTemplate(t)} style={{
              padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)',
              background: 'rgba(255,255,255,0.03)', cursor: 'pointer', textAlign: 'left',
              color: 'var(--text-primary)', fontSize: '0.85rem',
            }}>
              <div style={{ fontWeight: 600 }}>{t.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.type}</div>
            </button>
          ))}
          {templates.length === 0 && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>ยังไม่มีแม่แบบ</span>}
        </div>
      </div>

      {/* Create Template Form */}
      {showForm && (
        <div className="glass-panel-static" style={{ padding: '1rem', marginBottom: '1rem' }}>
          <form onSubmit={handleCreateTemplate} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <input className="input-field" placeholder="ชื่อแม่แบบ" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
              <select className="input-field" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                <option value="CUSTOM">กำหนดเอง</option>
                <option value="SHORTLIST_NOTIFICATION">แจ้งผลคัดกรอง</option>
                <option value="INTERVIEW_INVITATION">เชิญสัมภาษณ์</option>
                <option value="REJECTION">แจ้งปฏิเสธ</option>
                <option value="OFFER_LETTER">ข้อเสนองาน</option>
              </select>
            </div>
            <input className="input-field" placeholder="หัวข้อ" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} required />
            <textarea className="input-field" rows="4" placeholder="เนื้อหาอีเมล (HTML ได้)" value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} required />
            <button type="submit" className="btn btn-glow" style={{ alignSelf: 'flex-start' }}>สร้างแม่แบบ</button>
          </form>
        </div>
      )}

      {/* Send Email Form */}
      {showSend && (
        <div className="glass-panel-static" style={{ padding: '1rem', marginBottom: '1rem' }}>
          <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <input className="input-field" type="email" placeholder="อีเมลผู้รับ" value={sendForm.toEmail} onChange={e => setSendForm(p => ({ ...p, toEmail: e.target.value }))} required />
            <input className="input-field" placeholder="หัวข้อ" value={sendForm.subject} onChange={e => setSendForm(p => ({ ...p, subject: e.target.value }))} required />
            <textarea className="input-field" rows="4" placeholder="เนื้อหา" value={sendForm.body} onChange={e => setSendForm(p => ({ ...p, body: e.target.value }))} required />
            <button type="submit" className="btn btn-glow" style={{ alignSelf: 'flex-start' }}><Send size={14} /> ส่งอีเมล</button>
          </form>
        </div>
      )}

      {/* Sent Emails */}
      <div>
        <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>อีเมลที่ส่งแล้ว</h4>
        {sentEmails.length === 0 && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>ยังไม่มีอีเมลที่ส่ง</span>}
        {sentEmails.map(e => (
          <div key={e.id} style={{
            padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)',
            marginBottom: '0.5rem', background: 'rgba(255,255,255,0.02)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{e.toEmail}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(e.sentAt).toLocaleString('th-TH')}</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{e.subject}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmailManager;
