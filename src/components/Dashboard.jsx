import React, { useState, useEffect } from 'react';
import { Zap, ClipboardList, LogOut, User, BarChart3, Briefcase, GitBranch, Calendar, Mail, FileText, History, Download } from 'lucide-react';
import JobRequirementsForm from './JobRequirementsForm';
import CandidateRanking from './CandidateRanking';
import ComparativeAnalysis from './ComparativeAnalysis';
import ShortlistView from './ShortlistView';
import JobSelector from './JobSelector';
import PipelineBoard from './PipelineBoard';
import InterviewScheduler from './InterviewScheduler';
import EmailManager from './EmailManager';
import OfferManager from './OfferManager';
import ActivityLog from './ActivityLog';
import ExportPDF from './ExportPDF';
import { analyzeCandidates } from '../services/llmClient';
import { API_URL } from '../config.js';

const ROLE_LABELS = { ADMIN: '👑 Admin', HR_MANAGER: '💼 HR Manager', INTERVIEWER: '🗣️ Interviewer', VIEWER: '👁️ Viewer' };

const Dashboard = ({ candidates, setCandidates, user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('requirements');
  const [jobReq, setJobReq] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [shortlist, setShortlist] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobRefresh, setJobRefresh] = useState(0);

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
      if (isAlreadyShortlisted) setShortlist(prev => [...prev, candidate]);
      else setShortlist(prev => prev.filter(c => c.id !== candidate.id));
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

  // ── Tabs ────────────────────────────────────────────────────────
  const tabs = [
    { id: 'requirements', label: 'รายละเอียดงาน', Icon: Briefcase, section: 'workspace' },
    { id: 'pipeline', label: 'Pipeline ผู้สมัคร', Icon: GitBranch, section: 'recruit', disabled: !selectedJob },
    { id: 'interviews', label: 'นัดสัมภาษณ์', Icon: Calendar, section: 'recruit', disabled: !selectedJob },
    { id: 'emails', label: 'อีเมล', Icon: Mail, section: 'recruit', disabled: !selectedJob },
    { id: 'offers', label: 'ข้อเสนองาน', Icon: FileText, section: 'recruit', disabled: !selectedJob },
    { id: 'ranking', label: 'จัดอันดับผู้สมัคร', Icon: BarChart3, section: 'analysis', disabled: !analysisResults },
    { id: 'comparison', label: 'เปรียบเทียบ Top 5', Icon: Zap, section: 'analysis', disabled: !analysisResults },
    { id: 'shortlist', label: 'Shortlist', Icon: ClipboardList, section: 'results', badge: shortlist.length || 0 },
    { id: 'activity', label: 'กิจกรรม', Icon: History, section: 'results' },
  ];

  const pageInfo = {
    requirements: { title: 'ระบบคัดกรองผู้สมัคร', Icon: Briefcase },
    pipeline: { title: 'Pipeline ผู้สมัคร', Icon: GitBranch },
    interviews: { title: 'นัดสัมภาษณ์', Icon: Calendar },
    emails: { title: 'จัดการอีเมล', Icon: Mail },
    offers: { title: 'ข้อเสนองาน', Icon: FileText },
    ranking: { title: 'ผลการจัดอันดับผู้สมัคร', Icon: BarChart3 },
    comparison: { title: 'วิเคราะห์และเปรียบเทียบโดย AI', Icon: Zap },
    shortlist: { title: 'Shortlist', Icon: ClipboardList },
    activity: { title: 'กิจกรรมล่าสุด', Icon: History },
  };

  const currentPage = pageInfo[activeTab];

  const sectionLabels = {
    workspace: 'พื้นที่ทำงาน',
    recruit: 'การสรรหา (Recruitment)',
    analysis: 'การวิเคราะห์ (Analysis)',
    results: 'ผลลัพธ์ (Results)',
  };

  // Group tabs by section
  const sections = {};
  tabs.forEach(tab => {
    if (!sections[tab.section]) sections[tab.section] = [];
    sections[tab.section].push(tab);
  });

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

        {/* Job Selector */}
        <div style={{ padding: '0 0.75rem', marginBottom: '0.5rem' }}>
          <JobSelector selectedJob={selectedJob} setSelectedJob={setSelectedJob} user={user} refreshTrigger={jobRefresh} />
        </div>

        <nav className="sidebar-nav">
          {Object.entries(sections).map(([sectionKey, sectionTabs]) => (
            <React.Fragment key={sectionKey}>
              <div className="sidebar-section-label">{sectionLabels[sectionKey]}</div>
              {sectionTabs.map(({ id, label, Icon, disabled, badge }) => (
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
            </React.Fragment>
          ))}
        </nav>

        {/* Role Badge + Export */}
        <div style={{ padding: '0 0.75rem', marginBottom: '0.5rem' }}>
          <ExportPDF job={selectedJob} />
        </div>

        {/* User Info */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar"><User size={16} /></div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name}</div>
              <div className="sidebar-user-role" style={{ fontSize: '0.7rem' }}>
                {ROLE_LABELS[user?.role] || user?.role}
              </div>
            </div>
            <button className="sidebar-logout" onClick={onLogout} title="ออกจากระบบ">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="main-content">
        <header className="top-bar">
          <div className="top-bar-title">
            <currentPage.Icon size={20} className="page-icon" />
            <h1>{currentPage.title}</h1>
            {selectedJob && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>— {selectedJob.title}</span>}
          </div>
          <div className="top-bar-actions">
            <div className="status-chip">
              <span className="dot"></span>
              <span>ผู้สมัคร {candidates.length} คน</span>
            </div>
            <button
              className="auto-select-btn"
              onClick={() => handleRunAnalysis(true)}
              disabled={isAnalyzing || candidates.length === 0 || !jobReq.trim()}
              title="ให้ AI ช่วยเลือกผู้สมัครที่ดีที่สุดให้ทันที"
            >
              <Zap size={14} />
              {isAnalyzing ? 'กำลังประมวลผล…' : 'ค้นหาตัวท็อป'}
            </button>
          </div>
        </header>

        <main key={activeTab} className="page-content animate-fade-in">
          {activeTab === 'requirements' && (
            <JobRequirementsForm
              jobReq={jobReq} setJobReq={setJobReq}
              onAnalyze={handleRunAnalysis} isAnalyzing={isAnalyzing}
              candidatesCount={candidates.length}
              setCandidates={setCandidates} candidates={candidates}
            />
          )}
          {activeTab === 'pipeline' && <PipelineBoard job={selectedJob} user={user} />}
          {activeTab === 'interviews' && <InterviewScheduler job={selectedJob} user={user} />}
          {activeTab === 'emails' && <EmailManager job={selectedJob} user={user} />}
          {activeTab === 'offers' && <OfferManager job={selectedJob} user={user} />}
          {activeTab === 'ranking' && <CandidateRanking results={analysisResults} originalCandidates={candidates} />}
          {activeTab === 'comparison' && <ComparativeAnalysis results={analysisResults} onShortlist={handleShortlist} shortlist={shortlist} />}
          {activeTab === 'shortlist' && <ShortlistView shortlist={shortlist} onRemove={handleRemoveFromShortlist} jobReq={jobReq} />}
          {activeTab === 'activity' && <ActivityLog jobId={selectedJob?.id} />}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
