import React, { useState, useEffect } from 'react';
import { User, Star, Eye } from 'lucide-react';
import { API_URL } from '../config.js';

const STAGES = [
  { key: 'APPLIED', label: 'สมัคร', color: '#475569', bg: '#f8fafc', icon: '📨' },
  { key: 'SCREENING', label: 'คัดกรอง', color: '#d97706', bg: '#fffbeb', icon: '🔍' },
  { key: 'INTERVIEW', label: 'สัมภาษณ์', color: '#2563eb', bg: '#eff6ff', icon: '🗣️' },
  { key: 'OFFER', label: 'ยื่นข้อเสนอ', color: '#0891b2', bg: '#ecfeff', icon: '📋' },
  { key: 'HIRED', label: 'จ้างงาน', color: '#059669', bg: '#ecfdf5', icon: '🎉' },
  { key: 'REJECTED', label: 'ปฏิเสธ', color: '#dc2626', bg: '#fef2f2', icon: '❌' },
];

const STAGE_FLOW = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED'];

const PipelineBoard = ({ job, user, onSelectCandidate }) => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div className="enterprise-view-container animate-fade-in">
      {/* Stats row */}
      <div className="stats-row mb-4">
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
        <div className="empty-state-box">
          <User size={36} className="text-muted mb-2" />
          <h3 className="empty-title">ยังไม่มีผู้สมัครในตำแหน่งนี้</h3>
          <p className="empty-desc">ไปที่หน้า "รายละเอียดและคุณสมบัติงาน" เพื่อเพิ่มหรือวิเคราะห์ผู้สมัคร</p>
        </div>
      ) : (
        <div className="kanban-board-container">
          {STAGES.map(stage => {
            const candidates = pipeline[stage.key] || [];
            return (
              <div key={stage.key} className="kanban-column" style={{ background: stage.bg }}>
                {/* Stage Header */}
                <div className="kanban-column-header">
                  <span className="kanban-column-title" style={{ color: stage.color }}>
                    <span>{stage.icon}</span> {stage.label}
                  </span>
                  <span className="kanban-column-count" style={{ background: stage.color }}>
                    {candidates.length}
                  </span>
                </div>

                {/* Candidate Cards */}
                <div className="kanban-cards-stack">
                  {candidates.map(jc => (
                    <div 
                      key={jc.candidateId} 
                      className="kanban-candidate-card"
                      onClick={() => onSelectCandidate && onSelectCandidate(jc.candidate)}
                    >
                      <div className="kanban-card-top">
                        <div className="kanban-avatar">
                          {jc.candidate.name.charAt(0)}
                        </div>
                        <div className="kanban-card-info">
                          <div className="kanban-cand-name">{jc.candidate.name}</div>
                          <div className="kanban-cand-role">{jc.candidate.currentRole || '-'}</div>
                        </div>
                        <button
                          type="button"
                          className="kanban-inspect-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSelectCandidate) onSelectCandidate(jc.candidate);
                          }}
                          title="ดูรายละเอียด Dossier"
                        >
                          <Eye size={12} />
                        </button>
                      </div>

                      {jc.aiScore && (
                        <div className="kanban-score-tag">
                          <Star size={11} fill="currentColor" /> 
                          <span>AI Score: <strong>{jc.aiScore}</strong></span>
                        </div>
                      )}

                      {canEdit && STAGE_FLOW.includes(stage.key) && (
                        <div className="kanban-move-actions" onClick={(e) => e.stopPropagation()}>
                          {STAGE_FLOW.indexOf(stage.key) > 0 && (
                            <button
                              type="button"
                              className="btn-move-stage btn-move-back"
                              onClick={() => moveCandidate(jc.candidateId, stage.key, 'backward')}
                            >
                              ← ถอย
                            </button>
                          )}
                          {STAGE_FLOW.indexOf(stage.key) < STAGE_FLOW.length - 1 && (
                            <button
                              type="button"
                              className="btn-move-stage btn-move-next"
                              onClick={() => moveCandidate(jc.candidateId, stage.key, 'forward')}
                            >
                              เลื่อนขั้น →
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
