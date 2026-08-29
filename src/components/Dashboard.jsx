import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, ClipboardList, LogOut, User, BarChart3, Briefcase, 
  GitBranch, Calendar, Mail, FileText, History, Zap, Search,
  ChevronRight, Building2, Layers, Inbox
} from 'lucide-react';
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
import ApplicationsInbox from './ApplicationsInbox';
import CandidateDetailDrawer from './CandidateDetailDrawer';
import { analyzeCandidates } from '../services/llmClient';
import { useToast } from '../context/ToastContext';
import { API_URL } from '../config.js';

const ROLE_LABELS = { 
  ADMIN: '👑 Super Admin', 
  HR_MANAGER: '💼 HR Manager', 
  INTERVIEWER: '🗣️ Lead Interviewer', 
  VIEWER: '👁️ Read-Only Viewer' 
};

const Dashboard = ({ candidates, setCandidates, user, onLogout }) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('requirements');
  const [jobReq, setJobReq] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [shortlist, setShortlist] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobRefresh] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Drawer state for inspecting any candidate
  const [inspectCandidate, setInspectCandidate] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchWorkspaceData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const requestOptions = {
          headers: { 'Authorization': `Bearer ${token}` },
          credentials: 'include',
        };
        const [candidatesRes, shortlistRes] = await Promise.all([
          fetch(`${API_URL}/candidates`, requestOptions),
          fetch(`${API_URL}/candidates/shortlists`, requestOptions),
        ]);
        if (isMounted && candidatesRes.ok) {
          setCandidates(await candidatesRes.json());
        }
        if (isMounted && shortlistRes.ok) {
          setShortlist(await shortlistRes.json());
        }
      } catch (err) {
        console.error('Error fetching workspace data:', err);
      }
    };
    fetchWorkspaceData();
    return () => { isMounted = false; };
  }, [setCandidates]);

  const handleShortlist = async (candidate) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/candidates/shortlist/${candidate.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          score: candidate.score || candidate.aiScore,
          matchedSkills: candidate.matchedSkills || [],
          missingSkills: candidate.missingSkills || [],
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'ไม่สามารถบันทึก Shortlist ได้');

      if (data.isShortlisted) {
        setShortlist(prev => [candidate, ...prev.filter(c => c.id !== candidate.id)]);
        toast.success(`เพิ่ม ${candidate.name} เข้าสู่ Shortlist สำเร็จ!`);
      } else {
        setShortlist(prev => prev.filter(c => c.id !== candidate.id));
        toast.info(`นำ ${candidate.name} ออกจาก Shortlist แล้ว`);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleRemoveFromShortlist = async (candidateId) => {
    const candidate = shortlist.find(c => c.id === candidateId);
    if (candidate) await handleShortlist(candidate);
  };

  const handleRunAnalysis = async (autoSelect = false) => {
    if (!jobReq.trim()) {
      toast.warning('กรุณาระบุรายละเอียดและคุณสมบัติงานที่ต้องการก่อนวิเคราะห์');
      return;
    }
    if (candidates.length === 0) {
      toast.warning('ไม่พบข้อมูลผู้สมัครในระบบ กรุณาอัปโหลดหรือโหลดข้อมูลตัวอย่างก่อน');
      return;
    }

    setIsAnalyzing(true);
    toast.info('กำลังส่งข้อมูลให้โมเดล AI วิเคราะห์และจัดอันดับ...');
    try {
      const response = await analyzeCandidates(jobReq, candidates);
      setAnalysisResults(response);
      toast.success(`AI วิเคราะห์ผู้สมัคร ${candidates.length} คนสำเร็จเรียบร้อย!`);
      setActiveTab(autoSelect === true ? 'comparison' : 'ranking');
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการวิเคราะห์ข้อมูล: ' + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
    } finally {
      onLogout();
    }
  };

  // ── Enterprise Navigation Tabs ──────────────────────────────────
  const tabs = [
    { id: 'requirements', label: 'รายละเอียดและคุณสมบัติงาน', Icon: Briefcase, section: 'workspace' },
    { id: 'applications', label: 'ใบสมัครเข้าใหม่', Icon: Inbox, section: 'recruit', badge: 0 },
    { id: 'pipeline', label: 'Pipeline ผู้สมัคร', Icon: GitBranch, section: 'recruit', disabled: !selectedJob },
    { id: 'interviews', label: 'นัดสัมภาษณ์', Icon: Calendar, section: 'recruit', disabled: !selectedJob },
    { id: 'emails', label: 'ศูนย์การติดต่อ (อีเมล)', Icon: Mail, section: 'recruit', disabled: !selectedJob },
    { id: 'offers', label: 'หนังสือข้อเสนองาน', Icon: FileText, section: 'recruit', disabled: !selectedJob },
    { id: 'ranking', label: 'ผลการจัดอันดับ AI', Icon: BarChart3, section: 'analysis', disabled: !analysisResults },
    { id: 'comparison', label: 'เปรียบเทียบเชิงลึก Top 5', Icon: Zap, section: 'analysis', disabled: !analysisResults },
    { id: 'shortlist', label: 'Shortlist ที่ผ่านเกณฑ์', Icon: ClipboardList, section: 'results', badge: shortlist.length || 0 },
    { id: 'activity', label: 'ประวัติและกิจกรรมระบบ', Icon: History, section: 'results' },
  ];

  const pageInfo = {
    requirements: { title: 'ระบบคัดกรองและบริหารความต้องการตำแหน่งงาน', subtitle: 'กำหนด Job Specification และจัดการคลังข้อมูลเรซูเม่', Icon: Briefcase },
    applications: { title: 'Candidate Applications Inbox', subtitle: 'ตรวจสอบใบสมัครจากหน้า Careers และส่งต่อเข้าสู่กระบวนการสรรหา', Icon: Inbox },
    pipeline: { title: 'Talent Acquisition Pipeline', subtitle: 'ติดตามสถานะผู้สมัครในแต่ละขั้นตอนกระบวนการสรรหา', Icon: GitBranch },
    interviews: { title: 'Interview Management Hub', subtitle: 'กำหนดการนัดสัมภาษณ์และบันทึกคะแนนการประเมิน', Icon: Calendar },
    emails: { title: 'Corporate Candidate Communications', subtitle: 'ส่งอีเมลแจ้งผล นัดสัมภาษณ์ และส่งข้อเสนองานผ่านเทมเพลต', Icon: Mail },
    offers: { title: 'Offer Letters & Onboarding Workflow', subtitle: 'จัดทำและติดตามการตอบรับหนังสือเสนอจ้างงาน', Icon: FileText },
    ranking: { title: 'AI Candidate Evaluation Scorecard', subtitle: 'ผลการวิเคราะห์คะแนนความเหมาะสมและ Skill Matrix โดย AI', Icon: BarChart3 },
    comparison: { title: 'Top Tier Talent Benchmark Matrix', subtitle: 'เปรียบเทียบผู้สมัครระดับท็อป 5 คนแบบเคียงข้างกัน', Icon: Zap },
    shortlist: { title: 'Executive Shortlisted Candidates', subtitle: 'รายชื่อผู้สมัครที่ผ่านการคัดเลือกเบื้องต้นเพื่อดำเนินการต่อ', Icon: ClipboardList },
    activity: { title: 'System Audit & Activity Logs', subtitle: 'บันทึกการดำเนินการและความเปลี่ยนแปลงข้อมูลในระบบ', Icon: History },
  };

  const currentPage = pageInfo[activeTab] || pageInfo['requirements'];
  const PageIcon = currentPage.Icon;

  const sectionLabels = {
    workspace: 'ตำแหน่งงานและคลังข้อมูล',
    recruit: 'กระบวนการสรรหา (Recruitment Operations)',
    analysis: 'การวิเคราะห์อัจฉริยะ (AI Intelligence)',
    results: 'ผลการคัดเลือกและรายงาน',
  };

  const sections = useMemo(() => {
    const s = {};
    tabs.forEach(tab => {
      if (!s[tab.section]) s[tab.section] = [];
      s[tab.section].push(tab);
    });
    return s;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysisResults, shortlist.length, selectedJob]);

  // High-fit candidate count
  const topCandidateCount = useMemo(() => {
    if (!analysisResults?.rankedCandidates) return 0;
    return analysisResults.rankedCandidates.filter(c => (c.score || c.aiScore || 0) >= 80).length;
  }, [analysisResults]);

  return (
    <div className="enterprise-layout">
      {/* ── 1. GLOBAL ENTERPRISE TOPBAR ── */}
      <header className="enterprise-topbar">
        <div className="topbar-left">
          <div className="topbar-brand">
            <div className="brand-icon-box">
              <Sparkles size={18} />
            </div>
            <div className="brand-text">
              <span className="brand-org-name">ENTERPRISE TALENT CLOUD</span>
              <span className="brand-app-name">AI Recruitment Suite</span>
            </div>
          </div>

          <div className="topbar-divider"></div>

          {/* Breadcrumb */}
          <div className="topbar-breadcrumb">
            <span className="breadcrumb-root"><Building2 size={13} /> สำนักงานใหญ่</span>
            <ChevronRight size={14} className="breadcrumb-separator" />
            <span className="breadcrumb-current">{currentPage.title}</span>
            {selectedJob && (
              <>
                <ChevronRight size={14} className="breadcrumb-separator" />
                <span className="breadcrumb-job-tag">{selectedJob.title}</span>
              </>
            )}
          </div>
        </div>

        <div className="topbar-right">
          {/* Global Quick Search */}
          <div className="topbar-search">
            <Search size={15} className="topbar-search-icon" />
            <input 
              type="text" 
              placeholder="ค้นหาผู้สมัคร ทักษะ หรือตำแหน่ง..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="topbar-search-input"
            />
          </div>

          {/* Global AI Action */}
          <button
            className="btn btn-primary btn-sm"
            onClick={() => handleRunAnalysis(true)}
            disabled={isAnalyzing || candidates.length === 0 || !jobReq.trim()}
            title="สั่งให้ AI ทำการประเมินและคัดเลือกผู้สมัครที่เหมาะสมที่สุด"
          >
            <Sparkles size={15} />
            <span>{isAnalyzing ? 'กำลังประมวลผล AI...' : 'ค้นหาตัวท็อป (AI Auto-Match)'}</span>
          </button>

          <div className="topbar-divider"></div>

          {/* User Profile & Role Hub */}
          <div className="topbar-user-badge">
            <div className="user-avatar-circle">
              <User size={15} />
            </div>
            <div className="user-meta-text">
              <span className="user-display-name">{user?.name || 'ผู้ใช้งาน'}</span>
              <span className="user-display-role">{ROLE_LABELS[user?.role] || user?.role}</span>
            </div>
            <button className="btn-icon-logout" onClick={handleLogout} title="ออกจากระบบ">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <div className="enterprise-body-wrapper">
        {/* ── 2. SIDEBAR NAVIGATION ── */}
        <aside className="enterprise-sidebar">
          {/* Active Job Selector Card */}
          <div className="sidebar-job-picker-card">
            <div className="job-picker-label">
              <Layers size={13} />
              <span>ตำแหน่งงานที่กำลังเปิดรับ</span>
            </div>
            <JobSelector 
              selectedJob={selectedJob} 
              setSelectedJob={setSelectedJob} 
              user={user} 
              refreshTrigger={jobRefresh} 
            />
          </div>

          {/* Grouped Navigation Links */}
          <nav className="sidebar-nav-groups">
            {Object.entries(sections).map(([sectionKey, sectionTabs]) => (
              <div key={sectionKey} className="nav-group">
                <div className="nav-group-title">{sectionLabels[sectionKey]}</div>
                <div className="nav-group-items">
                  {sectionTabs.map(({ id, label, Icon, disabled, badge }) => (
                    <button
                      key={id}
                      className={`nav-item ${activeTab === id ? 'active' : ''}`}
                      onClick={() => !disabled && setActiveTab(id)}
                      disabled={disabled}
                    >
                      <span className="nav-item-icon"><Icon size={17} /></span>
                      <span className="nav-item-label">{label}</span>
                      {badge > 0 && <span className="nav-item-badge">{badge}</span>}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* Sidebar Footer / Export Report */}
          <div className="sidebar-footer-box">
            <div className="sidebar-export-wrap">
              <ExportPDF job={selectedJob} />
            </div>
            <div className="system-status-indicator">
              <span className="status-live-dot"></span>
              <span>ระบบ AI พร้อมทำงาน (Typhoon v2.5)</span>
            </div>
          </div>
        </aside>

        {/* ── 3. MAIN WORKSPACE ── */}
        <main className="enterprise-main-area">

          {/* Workspace context header */}
          <div className="workspace-page-header">
            <div className="workspace-heading-group">
              <div className="workspace-eyebrow">
                <span className="eyebrow-dot"></span>
                RECRUITING OPERATIONS / {activeTab.toUpperCase()}
              </div>
              <div className="workspace-title-row">
                <div className="workspace-title-icon">
                  <PageIcon size={20} />
                </div>
                <div>
                  <h1 className="workspace-page-title">{currentPage.title}</h1>
                  <p className="workspace-page-subtitle">{currentPage.subtitle}</p>
                </div>
              </div>
            </div>
            <div className="workspace-header-meta">
              <div className="header-live-status"><span className="header-live-dot"></span> AI workspace online</div>
              <div className="header-date">ข้อมูลอัปเดตแบบต่อเนื่อง</div>
            </div>
          </div>
          
          {/* Executive KPI Summary Cards */}
          <div className="executive-kpi-grid">
            <div className="kpi-card">
              <div className="kpi-icon-wrap bg-blue-light">
                <User size={20} className="text-blue" />
              </div>
              <div className="kpi-data">
                <div className="kpi-value">{candidates.length}</div>
                <div className="kpi-label">ผู้สมัครในฐานข้อมูล</div>
              </div>
              <span className="kpi-sub">Total Pool</span>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrap bg-purple-light">
                <Briefcase size={20} className="text-purple" />
              </div>
              <div className="kpi-data">
                <div className="kpi-value">{selectedJob ? selectedJob.title : 'ยังไม่เลือก'}</div>
                <div className="kpi-label">ตำแหน่งงานปัจจุบัน</div>
              </div>
              <span className="kpi-sub">Active Position</span>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrap bg-emerald-light">
                <Sparkles size={20} className="text-emerald" />
              </div>
              <div className="kpi-data">
                <div className="kpi-value">{topCandidateCount > 0 ? `${topCandidateCount} คน` : (analysisResults ? '0 คน' : '-')}</div>
                <div className="kpi-label">ผ่านเกณฑ์ AI Score 80%+</div>
              </div>
              <span className="kpi-sub">Top Tier Candidates</span>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrap bg-amber-light">
                <ClipboardList size={20} className="text-amber" />
              </div>
              <div className="kpi-data">
                <div className="kpi-value">{shortlist.length} คน</div>
                <div className="kpi-label">Shortlisted</div>
              </div>
              <span className="kpi-sub">Ready for Interview</span>
            </div>
          </div>

          {/* Dynamic Active Tab Workspace */}
          <div key={activeTab} className="workspace-content animate-fade-in">
            {activeTab === 'requirements' && (
              <JobRequirementsForm
                jobReq={jobReq} 
                setJobReq={setJobReq}
                onAnalyze={handleRunAnalysis} 
                isAnalyzing={isAnalyzing}
                candidatesCount={candidates.length}
                setCandidates={setCandidates} 
                candidates={candidates}
                searchQuery={searchQuery}
                onSelectCandidate={(c) => setInspectCandidate(c)}
              />
            )}
            {activeTab === 'applications' && (
              <ApplicationsInbox
                job={selectedJob}
                onSelectCandidate={(candidate) => setInspectCandidate(candidate)}
              />
            )}
            {activeTab === 'pipeline' && (
              <PipelineBoard 
                job={selectedJob} 
                user={user} 
                onSelectCandidate={(c) => setInspectCandidate(c)}
              />
            )}
            {activeTab === 'interviews' && <InterviewScheduler job={selectedJob} user={user} />}
            {activeTab === 'emails' && <EmailManager job={selectedJob} user={user} />}
            {activeTab === 'offers' && <OfferManager job={selectedJob} user={user} />}
            {activeTab === 'ranking' && (
              <CandidateRanking 
                results={analysisResults} 
                originalCandidates={candidates} 
                onSelectCandidate={(c) => setInspectCandidate(c)}
                onShortlist={handleShortlist}
                shortlist={shortlist}
              />
            )}
            {activeTab === 'comparison' && (
              <ComparativeAnalysis 
                results={analysisResults} 
                onShortlist={handleShortlist} 
                shortlist={shortlist} 
                onSelectCandidate={(c) => setInspectCandidate(c)}
              />
            )}
            {activeTab === 'shortlist' && (
              <ShortlistView 
                shortlist={shortlist} 
                onRemove={handleRemoveFromShortlist} 
                jobReq={jobReq} 
                onSelectCandidate={(c) => setInspectCandidate(c)}
              />
            )}
            {activeTab === 'activity' && <ActivityLog jobId={selectedJob?.id} />}
          </div>

        </main>
      </div>

      {/* ── 4. CANDIDATE DETAIL SLIDE-OVER DRAWER ── */}
      <CandidateDetailDrawer
        candidate={inspectCandidate}
        isOpen={Boolean(inspectCandidate)}
        onClose={() => setInspectCandidate(null)}
        onShortlist={handleShortlist}
        isShortlisted={shortlist.some(s => s.id === inspectCandidate?.id)}
        onNavigateToTab={(tabId) => setActiveTab(tabId)}
      />
    </div>
  );
};

export default Dashboard;
