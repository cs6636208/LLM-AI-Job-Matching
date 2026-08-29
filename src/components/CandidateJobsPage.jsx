import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  MapPin,
  Search,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { API_URL } from '../config.js';

const PUBLIC_JOBS = [
  {
    id: 1,
    title: 'Senior Frontend Engineer',
    department: 'Product & Engineering',
    location: 'Bangkok · Hybrid',
    type: 'Full-time',
    posted: 'เปิดรับสมัครอยู่',
    description: 'ร่วมสร้างผลิตภัณฑ์ดิจิทัลที่ช่วยให้ทีม HR และคนทำงานค้นพบโอกาสที่ใช่ได้เร็วขึ้น',
    skills: ['React', 'TypeScript', 'Next.js'],
  },
  {
    id: 2,
    title: 'Product Designer',
    department: 'Design Studio',
    location: 'Remote · Thailand',
    type: 'Full-time',
    posted: 'เปิดรับสมัครอยู่',
    description: 'ออกแบบประสบการณ์ที่เรียบง่าย ใช้งานได้จริง และสร้างความแตกต่างให้กับผู้ใช้งานหลายล้านคน',
    skills: ['Figma', 'UX Research', 'Design System'],
  },
  {
    id: 3,
    title: 'People Operations Specialist',
    department: 'People & Culture',
    location: 'Bangkok · On-site',
    type: 'Full-time',
    posted: 'เปิดรับสมัครอยู่',
    description: 'ดูแลประสบการณ์ของพนักงานตั้งแต่วันแรกที่เข้าร่วมทีม จนเติบโตไปพร้อมกับองค์กร',
    skills: ['HR Operations', 'People Analytics', 'Communication'],
  },
];

const EMPTY_FORM = { fullName: '', email: '', phone: '', resume: null, consentAccepted: false };

const normalizePublicJob = (job) => ({
  ...job,
  skills: job.skills?.length ? job.skills : (job.rubrics || []).map((rubric) => rubric.name).filter(Boolean),
});

const CandidateJobsPage = () => {
  const [query, setQuery] = useState('');
  const [jobs, setJobs] = useState(PUBLIC_JOBS);
  const [selectedJob, setSelectedJob] = useState(PUBLIC_JOBS[0]);
  const [showApplication, setShowApplication] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    let isMounted = true;
    fetch(`${API_URL}/public/jobs`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Public jobs unavailable')))
      .then((publicJobs) => {
        if (!isMounted || !Array.isArray(publicJobs) || publicJobs.length === 0) return;
        const normalizedJobs = publicJobs.map(normalizePublicJob);
        setJobs(normalizedJobs);
        setSelectedJob(normalizedJobs[0]);
      })
      .catch(() => {
        // Keep the demo catalog visible when the backend is not running locally.
      });
    return () => { isMounted = false; };
  }, []);

  const filteredJobs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return jobs;
    return jobs.filter((job) =>
      [job.title, job.department, job.location, ...job.skills]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [jobs, query]);

  const openApplication = () => {
    setSubmitted(false);
    setShowApplication(true);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    fetch(`${API_URL}/public/jobs/${selectedJob.id}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        resumeName: form.resume?.name || null,
        consentAccepted: form.consentAccepted === true,
      }),
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'ส่งใบสมัครไม่สำเร็จ');
        setSubmitted(true);
      })
      .catch((error) => setSubmitError(error.message))
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="candidate-site">
      <header className="candidate-site-header">
        <a className="candidate-brand" href="/jobs" aria-label="Talent Cloud jobs home">
          <span className="candidate-brand-mark"><Sparkles size={15} /></span>
          <span>talent<span className="candidate-brand-dot">.</span>cloud</span>
        </a>
        <nav className="candidate-nav" aria-label="Candidate navigation">
          <a href="#open-roles">ตำแหน่งงาน</a>
          <a href="#why-us">ชีวิตที่ Talent Cloud</a>
          <a href="#about">เกี่ยวกับเรา</a>
        </nav>
        <a className="candidate-recruiter-link" href="/">สำหรับทีม HR <ArrowRight size={14} /></a>
      </header>

      <main>
        <section className="candidate-hero" id="about">
          <div className="candidate-hero-copy">
            <div className="candidate-eyebrow"><span></span> FIND YOUR NEXT CHAPTER</div>
            <h1>งานที่ใช่ เริ่มต้น<br /><em>ที่การค้นพบตัวเอง</em></h1>
            <p>ร่วมทีมที่ให้คุณได้ทำงานที่มีความหมาย เติบโตในแบบของคุณ และสร้างอนาคตของการทำงานไปด้วยกัน</p>
          </div>
          <div className="candidate-hero-orbit" aria-hidden="true">
            <div className="orbit-ring orbit-ring-one"></div>
            <div className="orbit-ring orbit-ring-two"></div>
            <div className="orbit-core"><Sparkles size={27} /></div>
            <span className="orbit-chip chip-one">Design</span>
            <span className="orbit-chip chip-two">Engineering</span>
            <span className="orbit-chip chip-three">People</span>
          </div>
        </section>

        <section className="job-search-shell" aria-label="ค้นหาตำแหน่งงาน">
          <div className="job-search-heading">
            <div><span className="candidate-section-kicker">OPEN ROLES</span><h2>ค้นหาโอกาสที่เหมาะกับคุณ</h2></div>
            <span className="job-result-count">{filteredJobs.length} ตำแหน่งที่เปิดรับ</span>
          </div>
          <div className="job-search-bar">
            <Search size={17} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาตำแหน่งงาน ทักษะ หรือทีม..." />
            <button type="button">ค้นหางาน</button>
          </div>
        </section>

        <section className="candidate-jobs-layout" id="open-roles">
          <div className="public-job-list">
            <div className="public-job-list-header"><h2>ตำแหน่งงานทั้งหมด</h2><span>เลือกตำแหน่งเพื่อดูรายละเอียด</span></div>
            {filteredJobs.map((job) => (
              <button
                type="button"
                key={job.id}
                className={`public-job-card ${selectedJob?.id === job.id ? 'selected' : ''}`}
                onClick={() => { setSelectedJob(job); setShowApplication(false); }}
              >
                <span className="public-job-icon"><BriefcaseBusiness size={18} /></span>
                <span className="public-job-card-copy">
                  <strong>{job.title}</strong>
                  <span>{job.department}</span>
                  <small><MapPin size={12} /> {job.location} <i>·</i> <Clock3 size={12} /> {job.type}</small>
                </span>
                <ArrowRight size={16} className="public-job-arrow" />
              </button>
            ))}
            {filteredJobs.length === 0 && <div className="public-job-empty">ไม่พบตำแหน่งงานที่ตรงกับคำค้นหา</div>}
          </div>

          {selectedJob && (
            <article className="public-job-detail">
              <div className="public-job-detail-top"><span className="job-status-pill"><span></span>{selectedJob.posted}</span><span className="public-job-id">JOB-{String(selectedJob.id).padStart(3, '0')}</span></div>
              <h2>{selectedJob.title}</h2>
              <p className="public-job-department">{selectedJob.department}</p>
              <div className="public-job-meta"><span><MapPin size={14} /> {selectedJob.location}</span><span><Clock3 size={14} /> {selectedJob.type}</span></div>
              <div className="public-job-detail-section"><h3>เกี่ยวกับตำแหน่งนี้</h3><p>{selectedJob.description}</p></div>
              <div className="public-job-detail-section"><h3>ทักษะที่เรามองหา</h3><div className="public-skill-list">{selectedJob.skills.map((skill) => <span key={skill}>{skill}</span>)}</div></div>
              <button type="button" className="candidate-apply-button" onClick={openApplication}>สมัครตำแหน่งนี้ <ArrowRight size={16} /></button>
              <p className="candidate-privacy-note">ใช้เวลาไม่เกิน 3 นาที · ข้อมูลของคุณจะถูกเก็บรักษาอย่างปลอดภัย</p>
            </article>
          )}
        </section>

        <section className="candidate-values" id="why-us">
          <div><span className="candidate-section-kicker">WHY TALENT CLOUD</span><h2>พื้นที่ที่คุณได้เป็นตัวเอง<br />และทำผลงานที่ดีที่สุด</h2></div>
          <div className="candidate-value-grid"><div><strong>01</strong><span>ทำงานอย่างมีความหมาย</span><p>ทุกโปรเจกต์ของเราช่วยให้คนและองค์กรเติบโตไปข้างหน้า</p></div><div><strong>02</strong><span>เติบโตไปพร้อมกัน</span><p>เรียนรู้จากทีมที่เก่งและมีพื้นที่ให้ลองสิ่งใหม่เสมอ</p></div><div><strong>03</strong><span>วัฒนธรรมที่ไว้ใจกัน</span><p>สื่อสารตรงไปตรงมา เคารพความแตกต่าง และลงมือทำ</p></div></div>
        </section>
      </main>

      <footer className="candidate-site-footer"><span>© 2026 Talent Cloud</span><span>สร้างอนาคตของการทำงานไปด้วยกัน</span></footer>

      {showApplication && (
        <div className="application-modal-backdrop" onClick={() => setShowApplication(false)}>
          <div className="application-modal" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="application-modal-close" onClick={() => setShowApplication(false)} aria-label="ปิด"><X size={18} /></button>
            {!submitted ? (
              <>
                <span className="candidate-section-kicker">APPLY NOW</span>
                <h2>สมัครงานตำแหน่ง<br /><em>{selectedJob.title}</em></h2>
                <p className="application-modal-subtitle">กรอกข้อมูลเบื้องต้น แล้วทีม People ของเราจะติดต่อกลับ</p>
                <form className="application-form" onSubmit={handleSubmit}>
                  <label>ชื่อ - นามสกุล<input required value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} placeholder="เช่น สมชาย ใจดี" /></label>
                  <label>อีเมล<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@email.com" /></label>
                  <label>เบอร์โทรศัพท์<input required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="08x-xxx-xxxx" /></label>
                  <label className="resume-upload">เรซูเม่ <span>PDF ไม่เกิน 5MB</span><div><Upload size={16} /><input required type="file" accept=".pdf,.doc,.docx" onChange={(event) => setForm({ ...form, resume: event.target.files?.[0] || null })} /><strong>{form.resume?.name || 'อัปโหลดไฟล์เรซูเม่'}</strong></div></label>
                  <label className="application-consent"><input required type="checkbox" checked={form.consentAccepted === true} onChange={(event) => setForm({ ...form, consentAccepted: event.target.checked })} /><span>ยินยอมให้ Talent Cloud เก็บและประมวลผลข้อมูลเพื่อพิจารณาการสมัครงานตามนโยบายความเป็นส่วนตัว</span></label>
                  {submitError && <div className="application-form-error">{submitError}</div>}
                  <button type="submit" className="candidate-apply-button" disabled={submitting}>{submitting ? 'กำลังส่งใบสมัคร...' : <>ส่งใบสมัคร <ArrowRight size={16} /></>}</button>
                </form>
              </>
            ) : (
              <div className="application-success"><span><CheckCircle2 size={25} /></span><h2>ส่งใบสมัครแล้ว</h2><p>ขอบคุณที่สนใจร่วมงานกับเรา ทีม People จะติดต่อกลับที่ <strong>{form.email}</strong></p><button type="button" className="candidate-apply-button" onClick={() => setShowApplication(false)}>กลับไปดูตำแหน่งงาน</button></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateJobsPage;
