import React, { useState, useEffect } from 'react';
import { MessageSquare, Lock, Trash2 } from 'lucide-react';
import { API_URL } from '../config.js';

const NotesPanel = ({ candidateId }) => {
  const [notes, setNotes] = useState([]);
  const [content, setContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  const fetchNotes = async () => {
    if (!candidateId) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/notes/${candidateId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
      credentials: 'include',
    });
    if (res.ok) setNotes(await res.json());
  };

  useEffect(() => { fetchNotes(); }, [candidateId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    const token = localStorage.getItem('token');
    await fetch(`${API_URL}/notes/${candidateId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      credentials: 'include',
      body: JSON.stringify({ content, isPrivate }),
    });
    setContent('');
    setIsPrivate(false);
    fetchNotes();
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem('token');
    await fetch(`${API_URL}/notes/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
      credentials: 'include',
    });
    fetchNotes();
  };

  return (
    <div>
      <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
        <MessageSquare size={16} /> บันทึก ({notes.length})
      </h4>

      <form onSubmit={handleAdd} style={{ marginBottom: '1rem' }}>
        <textarea
          className="input-field w-full"
          rows="2"
          placeholder="เขียนบันทึกเกี่ยวกับผู้สมัครคนนี้..."
          value={content}
          onChange={e => setContent(e.target.value)}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <input type="checkbox" checked={isPrivate} onChange={e => setIsPrivate(e.target.checked)} />
            <Lock size={12} /> ส่วนตัว (เฉพาะฉันเท่านั้น)
          </label>
          <button type="submit" className="btn btn-glow" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}>บันทึก</button>
        </div>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {notes.map(note => (
          <div key={note.id} style={{
            padding: '0.75rem', borderRadius: '8px',
            background: note.isPrivate ? 'rgba(255,200,0,0.05)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${note.isPrivate ? 'rgba(255,200,0,0.2)' : 'var(--border)'}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>{note.user.name}</span>
                {note.isPrivate && <Lock size={10} style={{ marginLeft: '0.3rem', color: 'var(--warning)' }} />}
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                  {new Date(note.createdAt).toLocaleString('th-TH')}
                </span>
              </div>
              <button onClick={() => handleDelete(note.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.2rem' }}>
                <Trash2 size={12} />
              </button>
            </div>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{note.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotesPanel;
