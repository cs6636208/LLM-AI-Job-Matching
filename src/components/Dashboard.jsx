import React, { useState, useEffect } from 'react';
import { Zap, ClipboardList, LogOut, User, BarChart3, Briefcase } from 'lucide-react';
import JobRequirementsForm from './JobRequirementsForm';
import CandidateRanking from './CandidateRanking';
import ComparativeAnalysis from './ComparativeAnalysis';
import ShortlistView from './ShortlistView';
import { analyzeCandidates } from '../services/llmClient';
import { API_URL } from '../config.js';

const Dashboard = ({ candidates, setCandidates, user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('requirements');
  const [jobReq, setJobReq] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [shortlist, setShortlist] = useState([]);

  useEffect(() => {
    const fetchShortlist = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(`${API_URL}/candidates/shortlists`, {
          headers: { 'Authorization': `Bearer ${token}` },
          credentials: 'include',
        });
        const data = await res.json();
        if (res.ok) setShortlist(data);
      } catch (err) {
        console.error('Error fetching shortlist:', err);
      }
    };
    fetchShortlist();
  }, []);

  const handleShortlist = async (candidate) => {
    const isAlreadyShortlisted = shortlist.find(c => c.id === candidate.id);

    if (isAlreadyShortlisted) {
      setShortlist(prev => prev.filter(c => c.id !== candidate.id));
    } else {
      setShortlist(prev => [...prev, candidate]);
    }

    const isMockCandidate = candidate.id?.startsWith('CAND-') || candidate.id?.startsWith('RAND-');
    if (isMockCandidate) return;

    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`${API_URL}/candidates/shortlist/${candidate.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ score: candidate.score, matchedSkills: candidate.matchedSkills, missingSkills: candidate.missingSkills }),
          credentials: 'include',
        });
      }
    } catch (err) {
      console.warn('Backend shortlist sync skipped:', err.message);
      if (isAlreadyShortlisted) {
        setShortlist(prev => [...prev, candidate]);
      } else {
        setShortlist(prev => prev.filter(c => c.id !== candidate.id));
      }
    }
  };

  const handleRemoveFromShortlist = async (candidateId) => {
    setShortlist(prev => prev.filter(c => c.id !== candidateId));
    const isMockCandidate = candidateId?.startsWith('CAND-') || candidateId?.startsWith('RAND-');
    if (isMockCandidate) return;
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`${API_URL}/candidates/shortlist/${candidateId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({}),
          credentials: 'include',
        });
      }
    } catch (err) {
      console.warn('Backend shortlist removal sync skipped:', err.message);
    }
  };

  const handleRunAnalysis = async (autoSelect = false) => {
    if (!jobReq.trim()) { alert('กรุณากรอกความต้องการของตำแหน่งงาน (Job Requirements) ก่อนครับ'); return; }
    if (candidates.length === 0) { alert("กรุณาโหลดข้อมูลผู้สมัครก่อนครับ สามารถกดปุ่ม 'โหลดข้อมูลจำลอง' ได้เลย"); return; }

    setIsAnalyzing(true);
    try {
      const response = await analyzeCandidates(jobReq, candidates);
      setAnalysisResults(response);
      setActiveTab(autoSelect === true ? 'comparison' : 'ranking');
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการวิเคราะห์ข้อมูล: ' + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const tabs = [
    { id: 'requirements', label: 'รายละเอียดงาน',  Icon: Briefcase,     section: 'พื้นที่ทำงาน (Workspace)' },
    { id: 'ranking',      label: 'จัดอันดับผู้สมัคร',  Icon: BarChart3,     section: 'การวิเคราะห์ (Analysis)', disabled: !analysisResults },
    { id: 'comparison',   label: 'เปรียบเทียบ Top 5', Icon: Zap,           section: 'การวิเคราะห์ (Analysis)', disabled: !analysisResults },
    { id: 'shortlist',    label: 'ผู้ที่ผ่านการคัดเลือก', Icon: ClipboardList, section: 'ผลลัพธ์ (Results)',  badge: shortlist.length || 0 },
  ];

  const pageInfo = {
    requirements: { title: 'ระบบคัดกรองผู้สมัคร', Icon: Briefcase, iconClass: 'blue' },
    ranking:      { title: 'ผลการจัดอันดับผู้สมัคร', Icon: BarChart3, iconClass: 'yellow' },
    comparison:   { title: 'วิเคราะห์และเปรียบเทียบโดย AI', Icon: Zap, iconClass: 'cyan' },
    shortlist:    { title: 'รายชื่อผู้ผ่านการคัดเลือก (Shortlist)', Icon: ClipboardList, iconClass: 'green' },
  };

  const currentPage = pageInfo[activeTab];

  return (
    <div className="dashboard-layout">
      {/* ── SIDEBAR ── */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">⚡</div>
          <div>
            <div className="sidebar-title">AI Job Matcher</div>
            <div className="sidebar-subtitle">ระบบสรรหาอัจฉริยะ</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">พื้นที่ทำงาน (Workspace)</div>
          {tabs.filter(t => t.section === 'พื้นที่ทำงาน (Workspace)').map(({ id, label, Icon, disabled, badge }) => (
            <button
              key={id}
              className={`sidebar-item ${activeTab === id ? 'active' : ''}`}
              onClick={() => !disabled && setActiveTab(id)}
              disabled={disabled}
            >
              <span className="sidebar-item-icon"><Icon size={18} /></span>
              <span>{label}</span>
              {badge > 0 && <span className="sidebar-badge">{badge}</span>}
            </button>
          ))}

          <div className="sidebar-section-label">การวิเคราะห์ (Analysis)</div>
          {tabs.filter(t => t.section === 'การวิเคราะห์ (Analysis)').map(({ id, label, Icon, disabled, badge }) => (
            <button
              key={id}
              className={`sidebar-item ${activeTab === id ? 'active' : ''}`}
              onClick={() => !disabled && setActiveTab(id)}
              disabled={disabled}
            >
              <span className="sidebar-item-icon"><Icon size={18} /></span>
              <span>{label}</span>
              {badge > 0 && <span className="sidebar-badge">{badge}</span>}
            </button>
          ))}

          <div className="sidebar-section-label">ผลลัพธ์ (Results)</div>
          {tabs.filter(t => t.section === 'ผลลัพธ์ (Results)').map(({ id, label, Icon, disabled, badge }) => (
            <button
              key={id}
              className={`sidebar-item ${activeTab === id ? 'active' : ''}`}
              onClick={() => !disabled && setActiveTab(id)}
              disabled={disabled}
            >
              <span className="sidebar-item-icon"><Icon size={18} /></span>
              <span>{label}</span>
              {badge > 0 && <span className="sidebar-badge">{badge}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              <User size={16} />
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name}</div>
              <div className="sidebar-user-role">ผู้ใช้งานระบบ</div>
            </div>
            <button className="sidebar-logout" onClick={onLogout} title="ออกจากระบบ">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="main-content">
        {/* Top Bar */}
        <header className="top-bar">
          <div className="top-bar-title">
            <currentPage.Icon size={20} className="page-icon" />
            <h1>{currentPage.title}</h1>
          </div>
          <div className="top-bar-actions">
            <div className="status-chip">
              <span className="dot"></span>
              <span>ผู้สมัครทั้งหมด {candidates.length} คน</span>
            </div>
            <button
              className="auto-select-btn"
              onClick={() => handleRunAnalysis(true)}
              disabled={isAnalyzing || candidates.length === 0 || !jobReq.trim()}
              title="ให้ AI ช่วยเลือกผู้สมัครที่ดีที่สุดให้ทันที"
            >
              <Zap size={14} />
              {isAnalyzing ? 'กำลังประมวลผล…' : 'ค้นหาตัวท็อป (Auto-Select)'}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main key={activeTab} className="page-content animate-fade-in">
          {activeTab === 'requirements' && (
            <JobRequirementsForm
              jobReq={jobReq}
              setJobReq={setJobReq}
              onAnalyze={handleRunAnalysis}
              isAnalyzing={isAnalyzing}
              candidatesCount={candidates.length}
              setCandidates={setCandidates}
              candidates={candidates}
            />
          )}
          {activeTab === 'ranking' && (
            <CandidateRanking results={analysisResults} originalCandidates={candidates} />
          )}
          {activeTab === 'comparison' && (
            <ComparativeAnalysis results={analysisResults} onShortlist={handleShortlist} shortlist={shortlist} />
          )}
          {activeTab === 'shortlist' && (
            <ShortlistView shortlist={shortlist} onRemove={handleRemoveFromShortlist} jobReq={jobReq} />
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
