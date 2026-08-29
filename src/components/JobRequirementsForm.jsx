import React, { useState, useMemo } from 'react';
import { 
  Upload, Briefcase, Sparkles, Shuffle, FileText, 
  Users, Database, Search, ArrowRight, Eye, CheckCircle2, 
  GraduationCap, Clock, Filter, Trash2
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { API_URL } from '../config.js';

const JOB_PRESETS = [
  {
    title: 'Frontend / React Developer',
    description: 'ต้องการ Frontend Developer ที่มีประสบการณ์ React, JavaScript (ES6+), HTML5, CSS3, TailwindCSS หรือ CSS Modules เข้าใจ REST API และ Git เป็นอย่างดี มีความรับผิดชอบและทำงานเป็นทีมได้ (รับประสบการณ์ 1-3 ปี)',
  },
  {
    title: 'Fullstack Node.js / React',
    description: 'ต้องการ Fullstack Developer เชี่ยวชาญ Node.js, Express, React, PostgreSQL/Prisma หรือ MongoDB มีความเข้าใจใน Microservices/RESTful APIs, JWT Authentication และ Docker (ประสบการณ์ 2-5 ปี)',
  },
  {
    title: 'Junior Web Developer (จบใหม่)',
    description: 'ต้องการ Junior Developer / Web Developer ประสบการณ์ 0-2 ปี (ยินดีรับนักศึกษาจบใหม่) มีพื้นฐาน HTML, CSS, JavaScript, React หรือ Node.js มีความกระตือรือร้นในการเรียนรู้เทคโนโลยีใหม่ๆ',
  },
  {
    title: 'Data Engineer / AI Engineer',
    description: 'ต้องการ Data Engineer หรือ AI Engineer เชี่ยวชาญ Python, SQL, Data Pipelines, ETL, Pandas, LLM Prompt Engineering, RAG Frameworks และ Cloud Platforms (AWS / GCP) ประสบการณ์ 2 ปีขึ้นไป',
  },
];

const JobRequirementsForm = ({ 
  jobReq, 
  setJobReq, 
  onAnalyze, 
  isAnalyzing, 
  candidatesCount, 
  setCandidates, 
  candidates,
  searchQuery = '',
  onSelectCandidate
}) => {
  const toast = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const [selectedExpFilter, setSelectedExpFilter] = useState('ALL');

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      toast.warning("ขนาดไฟล์เกิน 5MB กรุณาอัปโหลดไฟล์ที่เล็กกว่านี้");
      e.target.value = '';
      return;
    }

    setIsUploading(true);
    toast.info("กำลังใช้ AI สกัดข้อมูลและสร้างโปรไฟล์ผู้สมัครจากเรซูเม่...");
    try {
      const { extractResumeData } = await import('../services/llmClient.js');
      const newCandidate = await extractResumeData(file);

      const token = localStorage.getItem('token');
      if (token) {
        const saveResponse = await fetch(`${API_URL}/candidates/bulk`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ candidates: [newCandidate] }),
          credentials: 'include',
        });
        const saveData = await saveResponse.json().catch(() => ({}));
        if (!saveResponse.ok) throw new Error(saveData.error || 'ไม่สามารถบันทึกผู้สมัครได้');
        setCandidates(prev => [...(saveData.candidates || [newCandidate]), ...prev]);
      } else {
        setCandidates(prev => [newCandidate, ...prev]);
      }
      toast.success(`ดึงข้อมูลและเพิ่มผู้สมัคร "${newCandidate.name}" เรียบร้อยแล้ว!`);
    } catch (err) {
      console.error(err);
      toast.error("เกิดข้อผิดพลาดในการดึงข้อมูลจากเอกสาร: " + err.message);
    } finally {
      setIsUploading(false);
      e.target.value = ''; 
    }
  };

  const handleLoadMockData = async () => {
    try {
      const { mockResumes } = await import('../data/mockResumes.js');
      setCandidates(mockResumes);
      toast.success(`โหลดข้อมูลเรซูเม่ตัวอย่าง ${mockResumes.length} รายการเข้าสู่ระบบแล้ว`);
    } catch (err) {
      console.error(err);
      toast.error("ไม่สามารถโหลดชุดข้อมูลตัวอย่างได้");
    }
  };

  const handleGenerateRandom = async () => {
    try {
      const { generateMockResumes } = await import('../utils/mockGenerator.js');
      const freshResumes = generateMockResumes(100, candidates);
      setCandidates(prev => [...prev, ...freshResumes]);
      toast.success(`สุ่มสร้างโปรไฟล์ผู้สมัครใหม่ ${freshResumes.length} คน (รวม ${candidates.length + freshResumes.length} คน)`);
    } catch (err) {
      console.error(err);
      toast.error("ไม่สามารถสุ่มสร้างข้อมูลได้");
    }
  };

  const handleClearCandidates = () => {
    setCandidates([]);
    toast.info("ล้างข้อมูลผู้สมัครทั้งหมดเรียบร้อยแล้ว");
  };

  // Filter candidates for table
  const filteredCandidates = useMemo(() => {
    const query = (localSearch || searchQuery).trim().toLowerCase();
    return candidates.filter(c => {
      // Search filter
      const matchesSearch = !query || 
        (c.name && c.name.toLowerCase().includes(query)) ||
        (c.currentRole && c.currentRole.toLowerCase().includes(query)) ||
        (c.skills && c.skills.some(s => s.toLowerCase().includes(query)));

      // Exp filter
      const exp = c.yearsOfExperience ?? c.experience ?? 0;
      let matchesExp = true;
      if (selectedExpFilter === 'JUNIOR') matchesExp = exp <= 2;
      else if (selectedExpFilter === 'MID') matchesExp = exp > 2 && exp <= 5;
      else if (selectedExpFilter === 'SENIOR') matchesExp = exp > 5;

      return matchesSearch && matchesExp;
    });
  }, [candidates, localSearch, searchQuery, selectedExpFilter]);

  return (
    <div className="enterprise-view-container">
      
      {/* ── TOP SECTION: Job Spec Studio ── */}
      <div className="enterprise-card mb-6">
        <div className="card-header-with-action">
          <div className="card-header-title">
            <Briefcase size={18} className="text-primary" />
            <div>
              <h3 className="section-title">ข้อกำหนดและคุณสมบัติของตำแหน่งงาน (Job Specification)</h3>
              <p className="section-subtitle">อธิบายทักษะ ประสบการณ์ และวุฒิการศึกษาที่ต้องการ เพื่อให้โมเดล AI นำไปวิเคราะห์จับคู่</p>
            </div>
          </div>

          <div className="preset-dropdown-wrap">
            <span className="preset-label">ตัวอย่างตำแหน่งงาน:</span>
            <div className="preset-chips">
              {JOB_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="btn-preset-chip"
                  onClick={() => {
                    setJobReq(preset.description);
                    toast.info(`เลือกเทมเพลต "${preset.title}"`);
                  }}
                >
                  {preset.title}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="form-group mt-3">
          <textarea
            className="enterprise-textarea"
            rows="4"
            placeholder="ตัวอย่าง: ต้องการ Senior Frontend Developer ประสบการณ์ 3-5 ปี เชี่ยวชาญ React, TypeScript, Next.js, State Management, Responsive Design และเข้าใจหลักการ Clean Architecture..."
            value={jobReq}
            onChange={(e) => setJobReq(e.target.value)}
          />
        </div>

        <div className="job-action-bar">
          <div className="job-action-meta">
            <span className="meta-badge-text">
              <Users size={14} /> ผู้สมัครพร้อมวิเคราะห์: <strong>{candidatesCount} คน</strong>
            </span>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={() => onAnalyze(false)}
            disabled={isAnalyzing || candidatesCount === 0 || !jobReq.trim()}
          >
            {isAnalyzing ? (
              <>
                <span className="spinner-border"></span>
                <span>AI กำลังวิเคราะห์และเปรียบเทียบ...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>เริ่มการวิเคราะห์ด้วย AI (Run AI Screener)</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── MIDDLE SECTION: Talent Sourcing Studio ── */}
      <div className="mb-6">
        <div className="sourcing-cards-grid">
          
          {/* Card 1: Batch Resume Parser */}
          <div className="sourcing-card">
            <div className="sourcing-card-icon bg-blue-light text-blue">
              <Upload size={22} />
            </div>
            <div className="sourcing-card-body">
              <h4 className="sourcing-title">อัปโหลดเรซูเม่จริง (Resume Parser)</h4>
              <p className="sourcing-desc">รองรับไฟล์ PDF หรือ TXT ระบบจะใช้ AI สกัดประวัติ ทักษะ และการศึกษาอัตโนมัติ (ไม่เกิน 5MB)</p>
              
              <label className={`btn btn-secondary btn-sm mt-3 ${isUploading ? 'disabled' : ''}`}>
                <FileText size={15} />
                <span>{isUploading ? 'กำลังประมวลผลไฟล์...' : 'เลือกไฟล์เรซูเม่ (PDF/TXT)'}</span>
                <input 
                  type="file" 
                  accept=".pdf,.txt" 
                  onChange={handleFileUpload} 
                  disabled={isUploading}
                  style={{ display: 'none' }} 
                />
              </label>
            </div>
          </div>

          {/* Card 2: Synthetic Generator */}
          <div className="sourcing-card">
            <div className="sourcing-card-icon bg-purple-light text-purple">
              <Shuffle size={22} />
            </div>
            <div className="sourcing-card-body">
              <h4 className="sourcing-title">สุ่มสร้างฐานข้อมูล 100 คน</h4>
              <p className="sourcing-desc">สร้างชุดข้อมูลผู้สมัครจำลอง 100 คนที่มีความหลากหลายของทักษะ เพื่อทดสอบประสิทธิภาพการคัดกรอง</p>
              
              <button 
                type="button" 
                className="btn btn-secondary btn-sm mt-3"
                onClick={handleGenerateRandom}
              >
                <Shuffle size={15} />
                <span>สร้างผู้สมัครใหม่ 100 คน</span>
              </button>
            </div>
          </div>

          {/* Card 3: Standard Demo Dataset */}
          <div className="sourcing-card">
            <div className="sourcing-card-icon bg-emerald-light text-emerald">
              <Database size={22} />
            </div>
            <div className="sourcing-card-body">
              <h4 className="sourcing-title">โหลดชุดข้อมูลตัวอย่างมาตรฐาน</h4>
              <p className="sourcing-desc">โหลดข้อมูลผู้สมัครตัวอย่างตั้งต้น 10 คนสำหรับเริ่มทดสอบการใช้งานระบบอย่างรวดเร็ว</p>
              
              <button 
                type="button" 
                className="btn btn-secondary btn-sm mt-3"
                onClick={handleLoadMockData}
              >
                <CheckCircle2 size={15} />
                <span>โหลดชุดข้อมูล 10 คน</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ── BOTTOM SECTION: Candidates Repository Table ── */}
      <div className="enterprise-card">
        <div className="card-header-with-action">
          <div className="card-header-title">
            <Users size={18} className="text-primary" />
            <div>
              <h3 className="section-title">คลังข้อมูลผู้สมัครในระบบ (Candidate Pool)</h3>
              <p className="section-subtitle">แสดงรายชื่อทั้งหมด {candidates.length} คน (แสดงผลตามตัวกรอง {filteredCandidates.length} คน)</p>
            </div>
          </div>

          {/* Filters & Actions */}
          <div className="table-controls-bar">
            {/* Search */}
            <div className="table-search-input-wrap">
              <Search size={14} className="search-icon" />
              <input 
                type="text" 
                placeholder="ค้นหาชื่อ หรือ ทักษะ..." 
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="table-search-field"
              />
            </div>

            {/* Exp Filter */}
            <div className="filter-pill-group">
              <Filter size={13} className="text-muted" />
              <button 
                type="button"
                className={`filter-pill ${selectedExpFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setSelectedExpFilter('ALL')}
              >
                ทั้งหมด
              </button>
              <button 
                type="button"
                className={`filter-pill ${selectedExpFilter === 'JUNIOR' ? 'active' : ''}`}
                onClick={() => setSelectedExpFilter('JUNIOR')}
              >
                0-2 ปี
              </button>
              <button 
                type="button"
                className={`filter-pill ${selectedExpFilter === 'MID' ? 'active' : ''}`}
                onClick={() => setSelectedExpFilter('MID')}
              >
                3-5 ปี
              </button>
              <button 
                type="button"
                className={`filter-pill ${selectedExpFilter === 'SENIOR' ? 'active' : ''}`}
                onClick={() => setSelectedExpFilter('SENIOR')}
              >
                5+ ปี
              </button>
            </div>

            {candidates.length > 0 && (
              <button 
                type="button" 
                className="btn btn-outline-danger btn-sm"
                onClick={handleClearCandidates}
                title="ล้างข้อมูลผู้สมัครทั้งหมด"
              >
                <Trash2 size={14} />
                <span>ล้างข้อมูล</span>
              </button>
            )}
          </div>
        </div>

        {/* Table Content */}
        {filteredCandidates.length === 0 ? (
          <div className="empty-state-box">
            <Users size={36} className="text-muted mb-2" />
            <div className="empty-title">ไม่พบข้อมูลผู้สมัครที่ตรงกับเงื่อนไข</div>
            <p className="empty-desc">ลองปรับคำค้นหา หรือกดปุ่มโหลดข้อมูลตัวอย่างด้านบนเพื่อเริ่มต้น</p>
          </div>
        ) : (
          <div className="enterprise-table-container mt-4">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>#</th>
                  <th>ผู้สมัคร (Candidate)</th>
                  <th>ตำแหน่งปัจจุบัน (Role)</th>
                  <th>ประสบการณ์</th>
                  <th>วุฒิการศึกษา</th>
                  <th>ทักษะสำคัญ (Key Skills)</th>
                  <th style={{ textAlign: 'right', width: '120px' }}>การดำเนินการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.slice(0, 50).map((cand, idx) => (
                  <tr 
                    key={cand.id || idx} 
                    className="clickable-row"
                    onClick={() => onSelectCandidate && onSelectCandidate(cand)}
                  >
                    <td className="text-muted font-mono text-xs">{idx + 1}</td>
                    <td>
                      <div className="candidate-cell-profile">
                        <div className="table-avatar">
                          {cand.name ? cand.name.charAt(0).toUpperCase() : 'C'}
                        </div>
                        <div>
                          <div className="candidate-name-text">{cand.name}</div>
                          <div className="candidate-id-text">{cand.id || 'CAND'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="font-medium text-slate-800">
                        {cand.currentRole || cand.role || '-'}
                      </span>
                    </td>
                    <td>
                      <span className="exp-badge">
                        <Clock size={12} />
                        <span>{cand.yearsOfExperience ?? cand.experience ?? 0} ปี</span>
                      </span>
                    </td>
                    <td>
                      <span className="edu-text">
                        <GraduationCap size={13} />
                        <span>{cand.education || '-'}</span>
                      </span>
                    </td>
                    <td>
                      <div className="table-skills-wrap">
                        {cand.skills && cand.skills.slice(0, 3).map((sk, sIdx) => (
                          <span key={sIdx} className="table-skill-tag">{sk}</span>
                        ))}
                        {cand.skills && cand.skills.length > 3 && (
                          <span className="table-skill-more">+{cand.skills.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectCandidate) onSelectCandidate(cand);
                        }}
                      >
                        <Eye size={13} />
                        <span>ดูข้อมูล</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredCandidates.length > 50 && (
              <div className="table-footer-meta">
                <span>แสดง 50 รายการแรกจากทั้งหมด {filteredCandidates.length} คน</span>
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
};

export default JobRequirementsForm;
