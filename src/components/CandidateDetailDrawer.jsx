import React, { useEffect } from 'react';
import { 
  X, CheckCircle, AlertTriangle, Briefcase, GraduationCap, 
  Clock, Bookmark, BookmarkCheck, Calendar, Mail, FileText, Sparkles, Award
} from 'lucide-react';
import NotesPanel from './NotesPanel';

const CandidateDetailDrawer = ({ 
  candidate, 
  isOpen, 
  onClose, 
  onShortlist, 
  isShortlisted,
  onNavigateToTab
}) => {
  // Close drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !candidate) return null;

  const score = candidate.score || candidate.aiScore || null;
  const isHighFit = score >= 85;
  const isMidFit = score >= 70 && score < 85;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="enterprise-drawer animate-slide-left" onClick={(e) => e.stopPropagation()}>
        
        {/* ── Drawer Header ── */}
        <div className="drawer-header">
          <div className="drawer-header-info">
            <div className="drawer-avatar">
              {candidate.name ? candidate.name.charAt(0).toUpperCase() : 'C'}
            </div>
            <div>
              <div className="drawer-title-row">
                <h2 className="drawer-candidate-name">{candidate.name}</h2>
                <span className="candidate-id-badge">{candidate.id || 'CAND-PROFILE'}</span>
              </div>
              <p className="drawer-candidate-role">
                <Briefcase size={14} />
                <span>{candidate.currentRole || candidate.role || 'ไม่ระบุตำแหน่ง'}</span>
              </p>
            </div>
          </div>

          <div className="drawer-header-actions">
            {onShortlist && (
              <button 
                className={`btn btn-sm ${isShortlisted ? 'btn-success' : 'btn-secondary'}`}
                onClick={() => onShortlist(candidate)}
                title={isShortlisted ? 'ลบออกจาก Shortlist' : 'เพิ่มใน Shortlist'}
              >
                {isShortlisted ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                <span>{isShortlisted ? 'Shortlisted' : 'Shortlist'}</span>
              </button>
            )}
            <button className="drawer-close-btn" onClick={onClose} aria-label="ปิด">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ── Drawer Quick Bar ── */}
        <div className="drawer-meta-bar">
          <div className="meta-item">
            <Clock size={14} className="meta-icon" />
            <span>ประสบการณ์: <strong>{candidate.yearsOfExperience ?? candidate.experience ?? 0} ปี</strong></span>
          </div>
          <div className="meta-item">
            <GraduationCap size={14} className="meta-icon" />
            <span>การศึกษา: <strong>{candidate.education || 'ไม่ระบุ'}</strong></span>
          </div>
        </div>

        {/* ── Drawer Body ── */}
        <div className="drawer-content">

          {/* 1. AI Fit & Evaluation Assessment */}
          {score !== null && (
            <div className={`ai-assessment-card ${isHighFit ? 'fit-high' : isMidFit ? 'fit-mid' : 'fit-standard'}`}>
              <div className="ai-assessment-header">
                <div className="ai-score-ring-wrap">
                  <div className="ai-score-number">{score}</div>
                  <div className="ai-score-label">AI Match Score</div>
                </div>
                <div className="ai-assessment-verdict">
                  <div className="verdict-title">
                    <Sparkles size={16} />
                    <span>
                      {isHighFit ? '⭐ ผู้สมัครตรงตามคุณสมบัติระดับสูง (Top Tier Fit)' :
                       isMidFit ? '✓ ผู้สมัครมีความเหมาะสมดี (Strong Candidate)' :
                       'ℹ️ ผ่านเกณฑ์เบื้องต้น (Moderate Match)'}
                    </span>
                  </div>
                  <p className="verdict-desc">
                    {isHighFit ? 'มีทักษะหลักและประสบการณ์ตรงกับความต้องการของตำแหน่งงานเกือบครบถ้วน' :
                     isMidFit ? 'มีทักษะที่เกี่ยวข้องในเกณฑ์ดีและสามารถต่อยอดงานในตำแหน่งนี้ได้' :
                     'มีคุณสมบัติพื้นฐาน แต่ยังขาดทักษะเฉพาะทางบางรายการ'}
                  </p>
                </div>
              </div>

              {/* Skills Match Matrix */}
              <div className="skills-matrix-grid">
                <div className="matrix-col match-col">
                  <div className="matrix-title text-success">
                    <CheckCircle size={14} /> ทักษะที่ตรงตามเกณฑ์ (Matched Skills)
                  </div>
                  <div className="skills-pill-wrap">
                    {candidate.matchedSkills && candidate.matchedSkills.length > 0 ? (
                      candidate.matchedSkills.map((skill, idx) => (
                        <span key={idx} className="skill-badge badge-matched">✓ {skill}</span>
                      ))
                    ) : (
                      <span className="text-muted text-xs">ไม่มีข้อมูลทักษะที่ตรง</span>
                    )}
                  </div>
                </div>

                <div className="matrix-col missing-col">
                  <div className="matrix-title text-warning">
                    <AlertTriangle size={14} /> ทักษะที่ยังขาด (Missing Skills)
                  </div>
                  <div className="skills-pill-wrap">
                    {candidate.missingSkills && candidate.missingSkills.length > 0 ? (
                      candidate.missingSkills.map((skill, idx) => (
                        <span key={idx} className="skill-badge badge-missing">! {skill}</span>
                      ))
                    ) : (
                      <span className="text-muted text-xs">ครบถ้วนตามความต้องการ</span>
                    )}
                  </div>
                </div>
              </div>

              {/* AI Qualitative Pros & Cons */}
              <div className="ai-rationale-section">
                {candidate.pros && candidate.pros.length > 0 && (
                  <div className="pros-block">
                    <div className="rationale-header text-emerald-600">จุดเด่นที่น่าสนใจ (Pros)</div>
                    <ul className="rationale-list">
                      {candidate.pros.map((pro, i) => (
                        <li key={i}>{pro}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {candidate.cons && candidate.cons.length > 0 && (
                  <div className="cons-block">
                    <div className="rationale-header text-amber-600">ข้อควรพิจารณาเพิ่มเติม (Cons)</div>
                    <ul className="rationale-list">
                      {candidate.cons.map((con, i) => (
                        <li key={i}>{con}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. All Candidate Skills & Profile Summary */}
          <div className="drawer-section-card">
            <h4 className="drawer-section-title">
              <Award size={16} /> ทักษะและความสามารถทั้งหมด (All Skills)
            </h4>
            <div className="skills-pill-wrap mt-2">
              {candidate.skills && candidate.skills.length > 0 ? (
                candidate.skills.map((s, idx) => (
                  <span key={idx} className="skill-badge badge-neutral">{s}</span>
                ))
              ) : (
                <span className="text-muted text-xs">ไม่มีข้อมูลทักษะ</span>
              )}
            </div>

            {candidate.summary && (
              <div className="mt-4">
                <div className="drawer-subsection-label">สรุปประวัติและโปรไฟล์ (Profile Summary)</div>
                <div className="candidate-summary-box">
                  {candidate.summary}
                </div>
              </div>
            )}
          </div>

          {/* 3. Fast Operations & Actions */}
          <div className="drawer-section-card">
            <h4 className="drawer-section-title">
              <FileText size={16} /> การดำเนินการสรรหา (Recruitment Actions)
            </h4>
            <div className="drawer-actions-grid mt-3">
              <button 
                className="btn btn-secondary w-full"
                onClick={() => {
                  onClose();
                  if (onNavigateToTab) onNavigateToTab('interviews');
                }}
              >
                <Calendar size={15} />
                <span>นัดสัมภาษณ์</span>
              </button>
              <button 
                className="btn btn-secondary w-full"
                onClick={() => {
                  onClose();
                  if (onNavigateToTab) onNavigateToTab('emails');
                }}
              >
                <Mail size={15} />
                <span>ส่งอีเมลติดต่อ</span>
              </button>
            </div>
          </div>

          {/* 4. Internal Notes & HR Collaboration */}
          <div className="drawer-section-card">
            <NotesPanel candidateId={candidate.id} />
          </div>

        </div>

      </div>
    </div>
  );
};

export default CandidateDetailDrawer;
