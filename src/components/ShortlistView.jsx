import React, { useState } from 'react';
import { 
  ClipboardList, Trash2, Download, CheckCircle, Scale, Gavel, 
  Eye, Sparkles, Clock, GraduationCap 
} from 'lucide-react';
import ComparativeAnalysis from './ComparativeAnalysis';
import { judgeCandidates } from '../services/llmClient';
import { useToast } from '../context/ToastContext';

const ShortlistView = ({ shortlist = [], onRemove, jobReq, onSelectCandidate }) => {
  const toast = useToast();
  const [isComparing, setIsComparing] = useState(false);
  const [isJudging, setIsJudging] = useState(false);
  const [verdict, setVerdict] = useState(null);

  if (!shortlist || shortlist.length === 0) {
    return (
      <div className="empty-state-box">
        <ClipboardList size={40} className="text-muted mb-2" />
        <h3 className="empty-title">รายชื่อผู้เข้ารอบ (Shortlist) ยังว่างเปล่า</h3>
        <p className="empty-desc">
          คุณสามารถเลือกผู้สมัครที่น่าสนใจเข้ามาอยู่ใน Shortlist ได้จากหน้า "ผลการจัดอันดับ AI" หรือ "เปรียบเทียบ Top 5"
        </p>
      </div>
    );
  }

  const handleExport = () => {
    const header = "ชื่อ-นามสกุล,ตำแหน่งปัจจุบัน,ประสบการณ์(ปี),คะแนน,ทักษะที่มี,ทักษะที่ขาด\n";
    const rows = shortlist.map(c =>
      `"${c.name}","${c.currentRole || ''}",${c.yearsOfExperience ?? c.experience ?? 0},${c.score || c.aiScore || 0},"${(c.matchedSkills || []).join('; ')}","${(c.missingSkills || []).join('; ')}"`
    ).join('\n');
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), header + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shortlisted_candidates_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('ส่งออกข้อมูล Shortlist เป็นไฟล์ CSV เรียบร้อยแล้ว');
  };

  const handleJudge = async () => {
    if (!jobReq) {
      toast.warning("ไม่พบข้อกำหนดตำแหน่งงาน กรุณาระบุรายละเอียดงานในหน้า 'รายละเอียดและคุณสมบัติงาน' ก่อน");
      return;
    }
    
    setIsJudging(true);
    setVerdict(null);
    toast.info("กำลังส่ง Shortlist ให้โมเดล AI Judge ทำการตัดสินและสรุปผล...");
    try {
      const result = await judgeCandidates(jobReq, shortlist);
      setVerdict(result.verdict);
      toast.success("AI Judge ประเมินและสรุปผลการตัดสินเรียบร้อยแล้ว!");
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดในการประเมิน: " + err.message);
    } finally {
      setIsJudging(false);
    }
  };

  return (
    <div className="enterprise-view-container animate-fade-in">
      
      {/* ── Top Header & Actions ── */}
      <div className="enterprise-card mb-6">
        <div className="card-header-with-action">
          <div className="card-header-title">
            <div className="scorecard-header-icon bg-emerald-light text-emerald">
              <CheckCircle size={20} />
            </div>
            <div>
              <h3 className="section-title">Executive Shortlisted Candidates ({shortlist.length} คน)</h3>
              <p className="section-subtitle">
                รายชื่อผู้สมัครที่ผ่านการคัดกรองเบื้องต้น พร้อมเครื่องมือ Export และ AI Executive Final Judge
              </p>
            </div>
          </div>

          <div className="table-controls-bar">
            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              onClick={handleExport}
              title="ดาวน์โหลดเป็นไฟล์ CSV สำหรับนำไปใช้ใน Excel / Google Sheets"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>

            <button 
              type="button" 
              className={`btn btn-sm ${isComparing ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setIsComparing(!isComparing)}
            >
              <Scale size={14} />
              <span>{isComparing ? 'ดูตารางรายการ' : 'เปรียบเทียบผู้เข้ารอบ'}</span>
            </button>

            <button 
              type="button" 
              className="btn btn-primary btn-sm"
              onClick={handleJudge}
              disabled={isJudging}
            >
              <Gavel size={14} />
              <span>{isJudging ? 'AI กำลังตัดสิน...' : 'AI Executive Verdict'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── AI Executive Verdict Panel ── */}
      {verdict && (
        <div className="enterprise-card mb-6 border-emerald-500 bg-emerald-light/20">
          <div className="card-header-title mb-2">
            <Sparkles size={18} className="text-emerald" />
            <h4 className="font-semibold text-slate-900">คำตัดสินและข้อเสนอแนะสุดท้ายจาก AI (Executive Verdict)</h4>
          </div>
          <div className="candidate-summary-box text-slate-800" style={{ whiteSpace: 'pre-line', background: 'white' }}>
            {verdict}
          </div>
        </div>
      )}

      {/* ── View: Comparison or Table ── */}
      {isComparing ? (
        <ComparativeAnalysis 
          candidatesToCompare={shortlist} 
          onSelectCandidate={onSelectCandidate}
        />
      ) : (
        <div className="enterprise-card">
          <div className="enterprise-table-container">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>#</th>
                  <th>ผู้สมัคร (Candidate)</th>
                  <th>ตำแหน่งปัจจุบัน</th>
                  <th>ประสบการณ์</th>
                  <th>AI Score</th>
                  <th>ทักษะที่ตรงตามเกณฑ์</th>
                  <th style={{ textAlign: 'right', width: '150px' }}>การดำเนินการ</th>
                </tr>
              </thead>
              <tbody>
                {shortlist.map((candidate, idx) => {
                  const score = candidate.score || candidate.aiScore || 0;
                  return (
                    <tr 
                      key={candidate.id || idx}
                      className="clickable-row"
                      onClick={() => onSelectCandidate && onSelectCandidate(candidate)}
                    >
                      <td className="text-muted font-mono text-xs">{idx + 1}</td>
                      <td>
                        <div className="candidate-cell-profile">
                          <div className="table-avatar">
                            {candidate.name ? candidate.name.charAt(0).toUpperCase() : 'C'}
                          </div>
                          <div>
                            <div className="candidate-name-text">{candidate.name}</div>
                            <div className="candidate-id-text">{candidate.id || 'CAND'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="font-medium text-slate-800">
                          {candidate.currentRole || candidate.role || '-'}
                        </span>
                      </td>
                      <td>
                        <span className="exp-badge">
                          <Clock size={12} />
                          <span>{candidate.yearsOfExperience ?? candidate.experience ?? 0} ปี</span>
                        </span>
                      </td>
                      <td>
                        <span className="score-badge-inline">
                          {score} / 100
                        </span>
                      </td>
                      <td>
                        <div className="table-skills-wrap">
                          {candidate.matchedSkills && candidate.matchedSkills.slice(0, 3).map((sk, sIdx) => (
                            <span key={sIdx} className="table-skill-tag">{sk}</span>
                          ))}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          <button 
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onSelectCandidate) onSelectCandidate(candidate);
                            }}
                          >
                            <Eye size={13} />
                            <span>Dossier</span>
                          </button>
                          <button 
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemove(candidate.id);
                            }}
                            title="นำออกจาก Shortlist"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default ShortlistView;
