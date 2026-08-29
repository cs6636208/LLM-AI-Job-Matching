import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, CalendarDays, ChevronDown, FileText, Inbox, Search } from 'lucide-react';
import { API_URL } from '../config.js';

const STATUS_LABELS = {
  NEW: 'ใหม่',
  REVIEWING: 'กำลังตรวจสอบ',
  INTERVIEW: 'รอนัดสัมภาษณ์',
  REJECTED: 'ไม่ผ่านการคัดเลือก',
  HIRED: 'รับเข้าทำงาน',
};

const STATUS_CLASS = {
  NEW: 'application-status-new',
  REVIEWING: 'application-status-reviewing',
  INTERVIEW: 'application-status-interview',
  REJECTED: 'application-status-rejected',
  HIRED: 'application-status-hired',
};

const ApplicationsInbox = ({ job, onSelectCandidate }) => {
  const [applications, setApplications] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState('');

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const query = job?.id ? `?jobId=${job.id}` : '';
      const response = await fetch(`${API_URL}/applications${query}`, { headers: { Authorization: `Bearer ${token}` }, credentials: 'include' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'โหลดใบสมัครไม่สำเร็จ');
      setApplications(Array.isArray(data) ? data : []);
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  }, [job?.id]);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  const visibleApplications = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return applications.filter((application) => {
      const candidate = application.candidate || {};
      const matchesStatus = statusFilter === 'ALL' || application.status === statusFilter;
      const matchesSearch = !normalizedSearch || [candidate.name, candidate.email, application.job?.title].join(' ').toLowerCase().includes(normalizedSearch);
      return matchesStatus && matchesSearch;
    });
  }, [applications, search, statusFilter]);

  const updateStatus = async (applicationId, status) => {
    setUpdatingId(applicationId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/applications/${applicationId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, credentials: 'include',
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'เปลี่ยนสถานะไม่สำเร็จ');
      setApplications((current) => current.map((application) => application.id === applicationId ? { ...application, ...data } : application));
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="applications-inbox animate-fade-in">
      <div className="applications-summary-card">
        <div className="applications-summary-icon"><Inbox size={19} /></div>
        <div><span className="candidate-section-kicker">APPLICATION INBOX</span><h2>ใบสมัครจากหน้า Careers</h2><p>ตรวจสอบข้อมูลเบื้องต้นและส่งผู้สมัครเข้าสู่ขั้นตอนถัดไป</p></div>
        <div className="applications-summary-count"><strong>{applications.length}</strong><span>ใบสมัครทั้งหมด</span></div>
      </div>

      <div className="applications-toolbar">
        <div className="application-search"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหาชื่อหรืออีเมลผู้สมัคร..." /></div>
        <div className="application-filter-tabs">
          <button type="button" className={statusFilter === 'ALL' ? 'active' : ''} onClick={() => setStatusFilter('ALL')}>ทั้งหมด</button>
          {Object.entries(STATUS_LABELS).slice(0, 3).map(([status, label]) => <button type="button" className={statusFilter === status ? 'active' : ''} key={status} onClick={() => setStatusFilter(status)}>{label}</button>)}
        </div>
      </div>

      {error && <div className="application-inbox-error">{error}</div>}
      {loading ? <div className="application-inbox-empty">กำลังโหลดใบสมัคร...</div> : visibleApplications.length === 0 ? (
        <div className="application-inbox-empty"><Inbox size={30} /><strong>ยังไม่มีใบสมัครในมุมมองนี้</strong><span>เมื่อมีผู้สมัครส่งข้อมูลผ่านหน้า Careers รายการจะแสดงที่นี่</span></div>
      ) : (
        <div className="applications-table-card">
          <div className="applications-table-head"><span>ผู้สมัคร</span><span>ตำแหน่งงาน</span><span>วันที่สมัคร</span><span>สถานะ</span><span></span></div>
          {visibleApplications.map((application) => {
            const candidate = application.candidate || {};
            return <div className="application-row" key={application.id}>
              <button type="button" className="application-candidate" onClick={() => onSelectCandidate?.(candidate)}><span className="application-avatar">{candidate.name?.charAt(0)?.toUpperCase() || 'C'}</span><span><strong>{candidate.name}</strong><small>{candidate.email || 'ไม่มีอีเมล'}</small></span></button>
              <div className="application-job-cell"><strong>{application.job?.title || '-'}</strong><small><FileText size={12} /> Candidate application</small></div>
              <div className="application-date-cell"><CalendarDays size={13} />{new Date(application.appliedAt).toLocaleDateString('th-TH')}</div>
              <div className="application-status-cell"><span className={`application-status ${STATUS_CLASS[application.status] || ''}`}>{STATUS_LABELS[application.status] || application.status}</span></div>
              <div className="application-actions"><button type="button" className="application-view-button" onClick={() => onSelectCandidate?.(candidate)}>ดูโปรไฟล์ <ArrowRight size={13} /></button><select aria-label={`เปลี่ยนสถานะของ ${candidate.name}`} value={application.status} disabled={updatingId === application.id} onChange={(event) => updateStatus(application.id, event.target.value)}><option value="NEW">ใหม่</option><option value="REVIEWING">กำลังตรวจสอบ</option><option value="INTERVIEW">รอนัดสัมภาษณ์</option><option value="REJECTED">ไม่ผ่าน</option><option value="HIRED">รับเข้าทำงาน</option></select><ChevronDown size={13} className="application-select-icon" /></div>
            </div>;
          })}
        </div>
      )}
    </div>
  );
};

export default ApplicationsInbox;
