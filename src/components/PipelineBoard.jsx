import React, { useState, useEffect } from 'react';
import { ArrowRight, User, Star } from 'lucide-react';
import { API_URL } from '../config.js';

const STAGES = [
  { key: 'APPLIED', label: 'สมัคร', color: '#64748b', bg: '#f1f5f9', icon: '📨' },
  { key: 'SCREENING', label: 'คัดกรอง', color: '#d97706', bg: '#fffbeb', icon: '🔍' },
  { key: 'INTERVIEW', label: 'สัมภาษณ์', color: '#2563eb', bg: '#eff6ff', icon: '🗣️' },
  { key: 'OFFER', label: 'ยื่นข้อเสนอ', color: '#0891b2', bg: '#ecfeff', icon: '📋' },
  { key: 'HIRED', label: 'จ้างงาน', color: '#059669', bg: '#ecfdf5', icon: '🎉' },
  { key: 'REJECTED', label: 'ปฏิเสธ', color: '#dc2626', bg: '#fef2f2', icon: '❌' },
];

const STAGE_FLOW = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED'];

const PipelineBoard = ({ job, user }) => {
  const [pipeline, setPipeline] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchPipeline = async () => {
    if (!job?.id) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/pipeline/${job.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setPipeline(data.pipeline);
      }
    } catch (err) {
      console.error('Error fetching pipeline:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchPipeline();
  }, [job?.id]);

  const moveCandidate = async (candidateId, fromStage, direction) => {
    const currentIdx = STAGE_FLOW.indexOf(fromStage);
    const nextIdx = direction === 'forward' ? currentIdx + 1 : currentIdx - 1;
    if (nextIdx < 0 || nextIdx >= STAGE_FLOW.length) return;
    const newStage = STAGE_FLOW[nextIdx];

    setPipeline(prev => {
      const updated = { ...prev };
      const fromList = [...(updated[fromStage] || [])];
      const idx = fromList.findIndex(jc => jc.candidateId === candidateId);
      if (idx === -1) return prev;
      const [moved] = fromList.splice(idx, 1);
      updated[fromStage] = fromList;
      updated[newStage] = [...(updated[newStage] || []), { ...moved, stage: newStage }];
      return updated;
    });

    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/pipeline/${job.id}/${candidateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        credentials: 'include',
        body: JSON.stringify({ stage: newStage }),
      });
    } catch (err) {
      console.error('Error moving candidate:', err);
      fetchPipeline();
    }
  };

  const canEdit = ['ADMIN', 'HR_MANAGER'].includes(user?.role);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>กำลังโหลด pipeline...</div>;
  }

  const totalCandidates = Object.values(pipeline).flat().length;

  return (
    <div className="animate-fade-in">
      {/* Stats */}
      <div className="stats-row">
        {STAGES.map(s => (
          <div key={s.key} className="stat-card" style={{ minWidth: '90px' }}>
            <div style={{ fontSize: '1rem' }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: s.color }}>
                {pipeline[s.key]?.length || 0}
              </div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {totalCandidates === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <h3>ยังไม่มีผู้สมัครในงานนี้</h3>
          <p>เพิ่มผู้สมัครจากหน้า Database หรืออัปโหลด Resume</p>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {STAGES.map(stage => {
            const candidates = pipeline[stage.key] || [];
            return (
              <div key={stage.key} style={{
                minWidth: '220px', maxWidth: '260px', flex: '1 0 220px',
                background: stage.bg, borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)', padding: '0.5rem',
              }}>
                {/* Stage Header */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.35rem 0.5rem', marginBottom: '0.35rem',
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600, fontSize: '0.8rem', color: stage.color }}>
                    <span>{stage.icon}</span> {stage.label}
                  </span>
                  <span style={{
                    background: stage.color, color: '#fff', borderRadius: '10px',
                    padding: '0.05rem 0.45rem', fontSize: '0.65rem', fontWeight: 700,
                  }}>
                    {candidates.length}
                  </span>
                </div>

                {/* Candidate Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', minHeight: '40px' }}>
                  {candidates.map(jc => (
                    <div key={jc.candidateId} style={{
                      background: '#ffffff', borderRadius: 'var(--radius-sm)',
                      padding: '0.6rem', border: '1px solid var(--border-subtle)',
                      boxShadow: 'var(--shadow-sm)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                        <div style={{
                          width: '26px', height: '26px', borderRadius: '50%',
                          background: 'var(--accent-light)', display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.65rem', color: 'var(--accent)', fontWeight: 700,
                        }}>
                          {jc.candidate.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)' }}>{jc.candidate.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{jc.candidate.currentRole}</div>
                        </div>
                      </div>

                      {jc.aiScore && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 600, marginTop: '0.2rem' }}>
                          <Star size={10} fill="currentColor" /> {jc.aiScore}
                        </div>
                      )}

                      {canEdit && STAGE_FLOW.includes(stage.key) && (
                        <div style={{ display: 'flex', gap: '0.2rem', marginTop: '0.35rem' }}>
                          {STAGE_FLOW.indexOf(stage.key) > 0 && (
                            <button
                              onClick={() => moveCandidate(jc.candidateId, stage.key, 'backward')}
                              style={{
                                flex: 1, padding: '0.2rem', fontSize: '0.65rem',
                                background: '#f1f5f9', border: '1px solid var(--border-subtle)',
                                borderRadius: '4px', cursor: 'pointer', color: 'var(--text-tertiary)',
                              }}
                            >
                              ← กลับ
                            </button>
                          )}
                          {STAGE_FLOW.indexOf(stage.key) < STAGE_FLOW.length - 1 && (
                            <button
                              onClick={() => moveCandidate(jc.candidateId, stage.key, 'forward')}
                              style={{
                                flex: 1, padding: '0.2rem', fontSize: '0.65rem',
                                background: 'var(--accent)', border: '1px solid var(--accent)',
                                borderRadius: '4px', cursor: 'pointer', color: '#fff',
                              }}
                            >
                              ไปต่อ →
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PipelineBoard;
