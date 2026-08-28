import React, { useState, useEffect } from 'react';
import { History, User, Briefcase, ArrowRight, MessageSquare, Calendar, FileText } from 'lucide-react';
import { API_URL } from '../config.js';

const ACTION_ICONS = {
  job_created: { icon: Briefcase, color: 'var(--success)' },
  job_updated: { icon: Briefcase, color: 'var(--warning)' },
  job_deleted: { icon: Briefcase, color: '#ef4444' },
  candidate_added_to_job: { icon: User, color: 'var(--accent)' },
  stage_changed: { icon: ArrowRight, color: 'var(--cyan)' },
  shortlisted: { icon: FileText, color: 'var(--warning)' },
  interview_scheduled: { icon: Calendar, color: 'var(--accent)' },
  interview_updated: { icon: Calendar, color: 'var(--warning)' },
  note_added: { icon: MessageSquare, color: 'var(--text-muted)' },
  offer_created: { icon: FileText, color: 'var(--success)' },
  offer_updated: { icon: FileText, color: 'var(--warning)' },
};

const ActivityLog = ({ jobId, limit = 50 }) => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      const token = localStorage.getItem('token');
      const query = jobId ? `?jobId=${jobId}&limit=${limit}` : `?limit=${limit}`;
      const res = await fetch(`${API_URL}/activity${query}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include',
      });
      if (res.ok) setLogs(await res.json());
    };
    fetchLogs();
  }, [jobId, limit]);

  const formatDetails = (action, details) => {
    if (!details) return '';
    try {
      const d = typeof details === 'string' ? JSON.parse(details) : details;
      switch (action) {
        case 'stage_changed':
          return `${d.candidateName || ''}: ${d.from} → ${d.to}`;
        case 'candidate_added_to_job':
          return `เพิ่มลงงาน "${d.jobTitle || ''}"`;
        case 'job_created':
          return `สร้างงาน "${d.title || ''}"`;
        case 'interview_scheduled':
          return `สัมภาษณ์ ${d.candidateName || ''}`;
        default:
          return Object.entries(d).map(([k, v]) => `${k}: ${v}`).join(', ');
      }
    } catch { return ''; }
  };

  return (
    <div>
      <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
        <History size={16} /> กิจกรรมล่าสุด
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {logs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>ยังไม่มีกิจกรรม</div>
        )}
        {logs.map(log => {
          const meta = ACTION_ICONS[log.action] || { icon: History, color: 'var(--text-muted)' };
          const Icon = meta.icon;
          return (
            <div key={log.id} style={{
              display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
              padding: '0.5rem', borderRadius: '8px',
              background: 'rgba(255,255,255,0.02)',
            }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: `${meta.color}20`, display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon size={14} style={{ color: meta.color }} />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <strong>{log.user.name}</strong> {log.action.replace(/_/g, ' ')}
                </div>
                {formatDetails(log.action, log.details) && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                    {formatDetails(log.action, log.details)}
                  </div>
                )}
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  {new Date(log.createdAt).toLocaleString('th-TH')}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityLog;
