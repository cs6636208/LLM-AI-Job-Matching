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

const ROLE_LABELS = { ADMIN: '๐‘‘ Admin', HR_MANAGER: '๐’ผ HR Manager', INTERVIEWER: '๐—ฃ๏ธ Interviewer', VIEWER: '๐‘๏ธ Viewer' };

const Dashboard = ({ candidates, setCandidates, user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('requirements');
  const [jobReq, setJobReq] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [shortlist, setShortlist] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobRefresh, _setJobRefresh] = useState(0);

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
    if (!jobReq.trim()) { alert('เธเธฃเธธเธ“เธฒเธเธฃเธญเธเธเธงเธฒเธกเธ•เนเธญเธเธเธฒเธฃเธเธญเธเธ•เธณเนเธซเธเนเธเธเธฒเธ (Job Requirements) เธเนเธญเธเธเธฃเธฑเธ'); return; }
    if (candidates.length === 0) { alert("เธเธฃเธธเธ“เธฒเนเธซเธฅเธ”เธเนเธญเธกเธนเธฅเธเธนเนเธชเธกเธฑเธเธฃเธเนเธญเธเธเธฃเธฑเธ เธชเธฒเธกเธฒเธฃเธ–เธเธ”เธเธธเนเธก 'เนเธซเธฅเธ”เธเนเธญเธกเธนเธฅเธเธณเธฅเธญเธ' เนเธ”เนเน€เธฅเธข"); return; }
    setIsAnalyzing(true);
    try {
      const response = await analyzeCandidates(jobReq, candidates);
      setAnalysisResults(response);
      setActiveTab(autoSelect === true ? 'comparison' : 'ranking');
    } catch (error) {
      alert('เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”เนเธเธเธฒเธฃเธงเธดเน€เธเธฃเธฒเธฐเธซเนเธเนเธญเธกเธนเธฅ: ' + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // โ”€โ”€ Tabs โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
  const tabs = [
    { id: 'requirements', label: 'เธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”เธเธฒเธ', Icon: Briefcase, section: 'workspace' },
    { id: 'pipeline', label: 'Pipeline เธเธนเนเธชเธกเธฑเธเธฃ', Icon: GitBranch, section: 'recruit', disabled: !selectedJob },
    { id: 'interviews', label: 'เธเธฑเธ”เธชเธฑเธกเธ เธฒเธฉเธ“เน', Icon: Calendar, section: 'recruit', disabled: !selectedJob },
    { id: 'emails', label: 'เธญเธตเน€เธกเธฅ', Icon: Mail, section: 'recruit', disabled: !selectedJob },
    { id: 'offers', label: 'เธเนเธญเน€เธชเธเธญเธเธฒเธ', Icon: FileText, section: 'recruit', disabled: !selectedJob },
    { id: 'ranking', label: 'เธเธฑเธ”เธญเธฑเธเธ”เธฑเธเธเธนเนเธชเธกเธฑเธเธฃ', Icon: BarChart3, section: 'analysis', disabled: !analysisResults },
    { id: 'comparison', label: 'เน€เธเธฃเธตเธขเธเน€เธ—เธตเธขเธ Top 5', Icon: Zap, section: 'analysis', disabled: !analysisResults },
    { id: 'shortlist', label: 'Shortlist', Icon: ClipboardList, section: 'results', badge: shortlist.length || 0 },
    { id: 'activity', label: 'เธเธดเธเธเธฃเธฃเธก', Icon: History, section: 'results' },
  ];

  const pageInfo = {
    requirements: { title: 'เธฃเธฐเธเธเธเธฑเธ”เธเธฃเธญเธเธเธนเนเธชเธกเธฑเธเธฃ', Icon: Briefcase },
    pipeline: { title: 'Pipeline เธเธนเนเธชเธกเธฑเธเธฃ', Icon: GitBranch },
    interviews: { title: 'เธเธฑเธ”เธชเธฑเธกเธ เธฒเธฉเธ“เน', Icon: Calendar },
    emails: { title: 'เธเธฑเธ”เธเธฒเธฃเธญเธตเน€เธกเธฅ', Icon: Mail },
    offers: { title: 'เธเนเธญเน€เธชเธเธญเธเธฒเธ', Icon: FileText },
    ranking: { title: 'เธเธฅเธเธฒเธฃเธเธฑเธ”เธญเธฑเธเธ”เธฑเธเธเธนเนเธชเธกเธฑเธเธฃ', Icon: BarChart3 },
    comparison: { title: 'เธงเธดเน€เธเธฃเธฒเธฐเธซเนเนเธฅเธฐเน€เธเธฃเธตเธขเธเน€เธ—เธตเธขเธเนเธ”เธข AI', Icon: Zap },
    shortlist: { title: 'Shortlist', Icon: ClipboardList },
    activity: { title: 'เธเธดเธเธเธฃเธฃเธกเธฅเนเธฒเธชเธธเธ”', Icon: History },
  };

  const currentPage = pageInfo[activeTab];

  const sectionLabels = {
    workspace: 'เธเธทเนเธเธ—เธตเนเธ—เธณเธเธฒเธ',
    recruit: 'เธเธฒเธฃเธชเธฃเธฃเธซเธฒ (Recruitment)',
    analysis: 'เธเธฒเธฃเธงเธดเน€เธเธฃเธฒเธฐเธซเน (Analysis)',
    results: 'เธเธฅเธฅเธฑเธเธเน (Results)',
  };

  // Group tabs by section
  const sections = {};
  tabs.forEach(tab => {
    if (!sections[tab.section]) sections[tab.section] = [];
    sections[tab.section].push(tab);
  });

  return (
    <div className="dashboard-layout">
      {/* โ”€โ”€ SIDEBAR โ”€โ”€ */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">โก</div>
          <div>
            <div className="sidebar-title">AI Job Matcher</div>
            <div className="sidebar-subtitle">เธฃเธฐเธเธเธชเธฃเธฃเธซเธฒเธญเธฑเธเธเธฃเธดเธขเธฐ</div>
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
            <button className="sidebar-logout" onClick={onLogout} title="เธญเธญเธเธเธฒเธเธฃเธฐเธเธ">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* โ”€โ”€ MAIN CONTENT โ”€โ”€ */}
      <div className="main-content">
        <header className="top-bar">
          <div className="top-bar-title">
            <currentPage.Icon size={20} className="page-icon" />
            <h1>{currentPage.title}</h1>
            {selectedJob && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>โ€” {selectedJob.title}</span>}
          </div>
          <div className="top-bar-actions">
            <div className="status-chip">
              <span className="dot"></span>
              <span>เธเธนเนเธชเธกเธฑเธเธฃ {candidates.length} เธเธ</span>
            </div>
            <button
              className="auto-select-btn"
              onClick={() => handleRunAnalysis(true)}
              disabled={isAnalyzing || candidates.length === 0 || !jobReq.trim()}
              title="เนเธซเน AI เธเนเธงเธขเน€เธฅเธทเธญเธเธเธนเนเธชเธกเธฑเธเธฃเธ—เธตเนเธ”เธตเธ—เธตเนเธชเธธเธ”เนเธซเนเธ—เธฑเธเธ—เธต"
            >
              <Zap size={14} />
              {isAnalyzing ? 'เธเธณเธฅเธฑเธเธเธฃเธฐเธกเธงเธฅเธเธฅโ€ฆ' : 'เธเนเธเธซเธฒเธ•เธฑเธงเธ—เนเธญเธ'}
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
