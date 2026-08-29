import React from 'react';
import { Zap, CheckCircle, AlertTriangle, Eye, Bookmark, BookmarkCheck, Trophy, Sparkles } from 'lucide-react';

const ComparativeAnalysis = ({ 
  results, 
  candidatesToCompare, 
  onShortlist, 
  shortlist = [],
  onSelectCandidate
}) => {
  const candidates = candidatesToCompare || (results ? results.rankedCandidates.slice(0, 5) : null);

  if (!candidates || candidates.length === 0) {
    return (
      <div className="empty-state-box">
        <Zap size={40} className="text-muted mb-2" />
        <h3 className="empty-title">ไม่มีข้อมูลสำหรับการเปรียบเทียบ</h3>
        <p className="empty-desc">กรุณาสั่งให้ AI ทำการวิเคราะห์คัดกรองในหน้า "รายละเอียดและคุณสมบัติงาน" ก่อนครับ</p>
      </div>
    );
  }

  const isCandidateShortlisted = (id) => shortlist.some(c => c.id === id);

  return (
    <div className="enterprise-view-container animate-fade-in">
      {!candidatesToCompare && (
        <div className="enterprise-card mb-6">
          <div className="card-header-title">
            <div className="scorecard-header-icon bg-cyan-light text-cyan">
              <Zap size={20} />
            </div>
            <div>
              <h3 className="section-title">Top Tier Talent Benchmark Matrix</h3>
              <p className="section-subtitle">
                เปรียบเทียบจุดเด่น ทักษะ และข้อสังเกตของผู้สมัครที่ดีที่สุด 5 อันดับแรกแบบตัวต่อตัว (Side-by-Side)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Comparison Cards Grid ── */}
      <div className="comparison-cards-grid">
        {candidates.map((candidate, idx) => {
          const isShortlisted = isCandidateShortlisted(candidate.id);
          const isBestPick = !candidatesToCompare && idx === 0;
          const score = candidate.score || candidate.aiScore || 0;

          return (
            <div 
              key={candidate.id || idx} 
              className={`enterprise-comparison-card ${isBestPick ? 'highlight-best' : ''}`}
            >
              {isBestPick && (
                <div className="comparison-crown-tag">
                  <Trophy size={13} />
                  <span>AI Top Recommendation</span>
                </div>
              )}

              {/* Card Header Profile */}
              <div className="comparison-profile-block">
                <div className="comparison-avatar">
                  {candidate.name ? candidate.name.charAt(0).toUpperCase() : 'C'}
                </div>

                <div className="comparison-score-ring">
                  <span className="score-main">{score}</span>
                  <span className="score-sub">SCORE</span>
                </div>

                <h4 className="comparison-cand-name">{candidate.name}</h4>
                <p className="comparison-cand-role">{candidate.currentRole || 'ไม่ระบุตำแหน่ง'}</p>
                <div className="comparison-cand-exp text-muted text-xs mt-1">
                  ประสบการณ์ {candidate.yearsOfExperience ?? 0} ปี {candidate.education ? `• ${candidate.education}` : ''}
                </div>
              </div>

              {/* Skills Quick Matrix */}
              <div className="comparison-skills-block">
                <div className="comp-skills-title">ทักษะที่ตรงตามเกณฑ์:</div>
                <div className="skills-pill-wrap">
                  {candidate.matchedSkills && candidate.matchedSkills.length > 0 ? (
                    candidate.matchedSkills.slice(0, 3).map((sk, sIdx) => (
                      <span key={sIdx} className="skill-badge badge-matched text-xs">✓ {sk}</span>
                    ))
                  ) : (
                    <span className="text-muted text-xs">-</span>
                  )}
                </div>
              </div>

              {/* Pros Section */}
              <div className="comparison-section-box pros-box">
                <div className="comp-sec-header text-emerald-600">
                  <CheckCircle size={14} /> จุดเด่นหลัก
                </div>
                <ul className="comp-sec-list">
                  {candidate.pros && candidate.pros.length > 0 ? (
                    candidate.pros.map((pro, i) => <li key={i}>{pro}</li>)
                  ) : (
                    <li className="text-muted text-xs">ไม่มีข้อมูลระบุ</li>
                  )}
                </ul>
              </div>

              {/* Cons Section */}
              <div className="comparison-section-box cons-box">
                <div className="comp-sec-header text-amber-600">
                  <AlertTriangle size={14} /> ข้อควรระวัง / ทักษะที่ขาด
                </div>
                <ul className="comp-sec-list">
                  {candidate.cons && candidate.cons.length > 0 ? (
                    candidate.cons.map((con, i) => <li key={i}>{con}</li>)
                  ) : (
                    <li className="text-muted text-xs">ไม่มีข้อมูลระบุ</li>
                  )}
                </ul>
              </div>

              {/* Actions Footer */}
              <div className="comparison-card-actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm w-full"
                  onClick={() => onSelectCandidate && onSelectCandidate(candidate)}
                >
                  <Eye size={14} />
                  <span>ดู Dossier</span>
                </button>

                {onShortlist && (
                  <button
                    type="button"
                    className={`btn btn-sm w-full ${isShortlisted ? 'btn-success' : 'btn-primary'}`}
                    onClick={() => onShortlist(candidate)}
                  >
                    {isShortlisted ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                    <span>{isShortlisted ? 'Shortlisted' : 'เลือก Shortlist'}</span>
                  </button>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};

export default ComparativeAnalysis;
