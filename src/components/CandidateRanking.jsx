import React, { useState, useMemo } from 'react';
import { 
  Trophy, BarChart3, ChevronDown, ChevronUp, CheckCircle, 
  AlertTriangle, Eye, Bookmark, BookmarkCheck, Search, Filter,
  Sparkles, Clock, GraduationCap
} from 'lucide-react';

const CandidateRanking = ({ 
  results, 
  originalCandidates = [], 
  onSelectCandidate,
  onShortlist,
  shortlist = []
}) => {
  const [expandedId, setExpandedId] = useState(null);
  const [activeTierFilter, setActiveTierFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const rankedCandidates = useMemo(() => {
    return results?.rankedCandidates || [];
  }, [results]);

  const filteredList = useMemo(() => {
    return rankedCandidates.filter(c => {
      // Tier filter
      const score = c.score || c.aiScore || 0;
      let matchesTier = true;
      if (activeTierFilter === 'TOP') matchesTier = score >= 90;
      else if (activeTierFilter === 'STRONG') matchesTier = score >= 75 && score < 90;
      else if (activeTierFilter === 'MODERATE') matchesTier = score < 75;

      // Search filter
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q || 
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.currentRole && c.currentRole.toLowerCase().includes(q)) ||
        (c.matchedSkills && c.matchedSkills.some(s => s.toLowerCase().includes(q)));

      return matchesTier && matchesSearch;
    });
  }, [rankedCandidates, activeTierFilter, searchQuery]);

  if (!results || !results.rankedCandidates || results.rankedCandidates.length === 0) {
    return (
      <div className="empty-state-box">
        <BarChart3 size={40} className="text-muted mb-2" />
        <h3 className="empty-title">ยังไม่มีผลการจัดอันดับจาก AI</h3>
        <p className="empty-desc">กรุณากลับไปที่แท็บ "รายละเอียดและคุณสมบัติงาน" แล้วกดปุ่ม "เริ่มการวิเคราะห์ด้วย AI"</p>
      </div>
    );
  }

  const getScoreColorClass = (score) => {
    if (score >= 90) return 'score-pill-emerald';
    if (score >= 75) return 'score-pill-blue';
    return 'score-pill-amber';
  };

  return (
    <div className="enterprise-view-container animate-fade-in">
      
      {/* ── Header & Filter Bar ── */}
      <div className="enterprise-card mb-6">
        <div className="card-header-with-action">
          <div className="card-header-title">
            <div className="scorecard-header-icon">
              <Trophy size={20} className="text-amber" />
            </div>
            <div>
              <h3 className="section-title">AI Candidate Evaluation Scorecard</h3>
              <p className="section-subtitle">
                จัดอันดับผู้สมัครตามความตรงกันของคุณสมบัติ ทักษะ และประสบการณ์ ประเมินผลโดยโมเดล AI
              </p>
            </div>
          </div>

          {/* Search & Tier Chips */}
          <div className="table-controls-bar">
            <div className="table-search-input-wrap">
              <Search size={14} className="search-icon" />
              <input 
                type="text" 
                placeholder="ค้นหาในผลการจัดอันดับ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="table-search-field"
              />
            </div>

            <div className="filter-pill-group">
              <Filter size={13} className="text-muted" />
              <button 
                type="button" 
                className={`filter-pill ${activeTierFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setActiveTierFilter('ALL')}
              >
                ทั้งหมด ({rankedCandidates.length})
              </button>
              <button 
                type="button" 
                className={`filter-pill ${activeTierFilter === 'TOP' ? 'active' : ''}`}
                onClick={() => setActiveTierFilter('TOP')}
              >
                ⭐ Top Tier (90%+)
              </button>
              <button 
                type="button" 
                className={`filter-pill ${activeTierFilter === 'STRONG' ? 'active' : ''}`}
                onClick={() => setActiveTierFilter('STRONG')}
              >
                ✓ Strong Fit (75-89%)
              </button>
              <button 
                type="button" 
                className={`filter-pill ${activeTierFilter === 'MODERATE' ? 'active' : ''}`}
                onClick={() => setActiveTierFilter('MODERATE')}
              >
                Moderate (&lt;75%)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Ranked Candidate Cards ── */}
      <div className="ranking-cards-list">
        {filteredList.map((candidate, index) => {
          const isExpanded = expandedId === candidate.id;
          const score = candidate.score || candidate.aiScore || 0;
          const isShortlisted = shortlist.some(s => s.id === candidate.id);
          const originalProfile = originalCandidates.find(c => c.id === candidate.id);
          const fullCandidate = { ...originalProfile, ...candidate };

          return (
            <div 
              key={candidate.id || index} 
              className={`enterprise-ranking-card ${index < 3 ? 'rank-podium-' + (index + 1) : ''}`}
            >
              <div className="ranking-card-main-row">
                
                {/* 1. Rank Position Badge */}
                <div className="rank-position-badge">
                  {index === 0 ? '🥇 #1' : index === 1 ? '🥈 #2' : index === 2 ? '🥉 #3' : `#${index + 1}`}
                </div>

                {/* 2. Candidate Core Info */}
                <div className="ranking-candidate-info">
                  <div className="ranking-name-row">
                    <h4 className="ranking-candidate-name">{candidate.name}</h4>
                    <span className="candidate-id-badge">{candidate.id || 'CAND'}</span>
                  </div>

                  <div className="ranking-meta-row">
                    <span className="role-tag font-medium text-slate-700">
                      {candidate.currentRole || fullCandidate.currentRole || '-'}
                    </span>
                    <span className="meta-bullet">•</span>
                    <span className="exp-text text-muted text-xs">
                      <Clock size={12} /> ประสบการณ์ {candidate.yearsOfExperience ?? fullCandidate.yearsOfExperience ?? 0} ปี
                    </span>
                    {(candidate.education || fullCandidate.education) && (
                      <>
                        <span className="meta-bullet">•</span>
                        <span className="edu-text text-muted text-xs">
                          <GraduationCap size={12} /> {candidate.education || fullCandidate.education}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Skills Snapshot */}
                  <div className="skills-pill-wrap mt-2">
                    {candidate.matchedSkills && candidate.matchedSkills.slice(0, 4).map((sk, sIdx) => (
                      <span key={sIdx} className="skill-badge badge-matched">✓ {sk}</span>
                    ))}
                    {candidate.missingSkills && candidate.missingSkills.slice(0, 2).map((sk, sIdx) => (
                      <span key={sIdx} className="skill-badge badge-missing">! ขาด: {sk}</span>
                    ))}
                  </div>
                </div>

                {/* 3. AI Score Display */}
                <div className="ranking-score-box">
                  <div className={`score-display-pill ${getScoreColorClass(score)}`}>
                    <Sparkles size={14} />
                    <span className="score-num">{score}</span>
                    <span className="score-denom">/100</span>
                  </div>
                  <div className="score-progress-track">
                    <div 
                      className={`score-progress-fill ${score >= 90 ? 'bg-emerald' : score >= 75 ? 'bg-blue' : 'bg-amber'}`}
                      style={{ width: `${score}%` }}
                    ></div>
                  </div>
                </div>

                {/* 4. Action Buttons */}
                <div className="ranking-actions-box">
                  {onShortlist && (
                    <button 
                      type="button"
                      className={`btn btn-sm ${isShortlisted ? 'btn-success' : 'btn-secondary'}`}
                      onClick={() => onShortlist(fullCandidate)}
                      title={isShortlisted ? 'อยู่ใน Shortlist แล้ว' : 'เพิ่มใน Shortlist'}
                    >
                      {isShortlisted ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                      <span>{isShortlisted ? 'Shortlisted' : 'Shortlist'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => onSelectCandidate && onSelectCandidate(fullCandidate)}
                    title="เปิดดูรายละเอียดเชิงลึกและประวัติเต็ม"
                  >
                    <Eye size={15} />
                    <span>Dossier</span>
                  </button>

                  <button
                    type="button"
                    className="btn-icon-toggle"
                    onClick={() => setExpandedId(isExpanded ? null : candidate.id)}
                    aria-label="ย่อ/ขยายเหตุผล"
                  >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

              </div>

              {/* ── Expanded Qualitative AI Rationale ── */}
              {isExpanded && (
                <div className="ranking-expanded-section animate-fade-in">
                  <div className="expanded-grid">
                    <div className="expanded-col pros-side">
                      <div className="expanded-title text-emerald-600">
                        <CheckCircle size={14} /> จุดเด่นและคุณสมบัติที่ตรงเกณฑ์ (AI Pros)
                      </div>
                      <ul className="expanded-list">
                        {candidate.pros && candidate.pros.length > 0 ? (
                          candidate.pros.map((p, i) => <li key={i}>{p}</li>)
                        ) : (
                          <li className="text-muted text-xs">ไม่มีบันทึกข้อดีเฉพาะ</li>
                        )}
                      </ul>
                    </div>

                    <div className="expanded-col cons-side">
                      <div className="expanded-title text-amber-600">
                        <AlertTriangle size={14} /> จุดที่ต้องพิจารณาเพิ่มเติม (AI Cons)
                      </div>
                      <ul className="expanded-list">
                        {candidate.cons && candidate.cons.length > 0 ? (
                          candidate.cons.map((c, i) => <li key={i}>{c}</li>)
                        ) : (
                          <li className="text-muted text-xs">ไม่มีข้อสังเกตจุดด้อย</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
};

export default CandidateRanking;
