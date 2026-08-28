import React, { useState } from 'react';
import { Upload, Briefcase, Code, Zap, Shuffle, FileText, Users, Database } from 'lucide-react';
import { API_URL } from '../config.js';

const JobRequirementsForm = ({ jobReq, setJobReq, onAnalyze, isAnalyzing, candidatesCount, setCandidates, candidates }) => {

  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      alert("ขนาดไฟล์เกิน 5MB กรุณาอัปโหลดไฟล์ที่เล็กกว่านี้");
      e.target.value = '';
      return;
    }

    setIsUploading(true);
    try {
      const { extractResumeData } = await import('../services/llmClient.js');
      const newCandidate = await extractResumeData(file);

      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`${API_URL}/candidates/bulk`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ candidates: [newCandidate] }),
          credentials: 'include',
        });
      }

      setCandidates(prev => [newCandidate, ...prev]);
      alert(`ดึงข้อมูลและเพิ่มผู้สมัครสำเร็จ: ${newCandidate.name}`);
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการดึงข้อมูลจากเอกสาร: " + err.message);
    } finally {
      setIsUploading(false);
      e.target.value = ''; 
    }
  };

  const handleLoadMockData = async () => {
    try {
      const { mockResumes } = await import('../data/mockResumes.js');
      setCandidates(mockResumes);
      alert(`โหลดข้อมูล ${mockResumes.length} Mock Resume เสร็จเรียบร้อยแล้ว!`);
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถโหลด Mock Data ได้");
    }
  };

  const handleGenerateRandom = async () => {
    try {
      const { generateMockResumes } = await import('../utils/mockGenerator.js');
      const freshResumes = generateMockResumes(100, candidates);
      setCandidates(prev => [...prev, ...freshResumes]);
      alert(`สุ่มสร้างใหม่ ${freshResumes.length} คนที่ไม่ซ้ำกับชุดเดิม! (รวมทั้งหมด ${candidates.length + freshResumes.length} คนในระบบ)`);
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถสุ่มสร้างข้อมูลได้");
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Stats Row */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon blue"><Users size={20} /></div>
          <div>
            <div className="stat-value">{candidatesCount}</div>
            <div className="stat-label">ผู้สมัครทั้งหมด</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon cyan"><FileText size={20} /></div>
          <div>
            <div className="stat-value">{jobReq.trim() ? '1' : '0'}</div>
            <div className="stat-label">รายละเอียดงาน</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><Zap size={20} /></div>
          <div>
            <div className="stat-value" style={{ color: isAnalyzing ? 'var(--warning)' : (candidatesCount > 0 && jobReq.trim() ? 'var(--success)' : 'var(--text-muted)') }}>
              {isAnalyzing ? '...' : (candidatesCount > 0 && jobReq.trim() ? 'พร้อมประมวลผล' : 'รอข้อมูล')}
            </div>
            <div className="stat-label">สถานะ AI</div>
          </div>
        </div>
      </div>

      {/* Job Requirements Input */}
      <div className="section-header">
        <div className="section-header-icon blue"><Briefcase size={20} /></div>
        <div className="section-header-text">
          <h2>ความต้องการของตำแหน่งงาน</h2>
          <p>อธิบายคุณสมบัติของผู้สมัครที่ต้องการเพื่อให้ AI ช่วยคัดกรอง</p>
        </div>
      </div>

      <div className="glass-panel-static mb-8">
        <label className="input-label mb-2 block">ทักษะ, ประสบการณ์ และลักษณะนิสัยที่ต้องการ</label>
        <textarea
          className="input-field w-full"
          rows="5"
          placeholder="เช่น ต้องการ Senior React Developer ประสบการณ์ 5 ปีขึ้นไป ต้องรู้ Node.js, Next.js และสามารถสอนน้องๆ ในทีมได้..."
          value={jobReq}
          onChange={(e) => setJobReq(e.target.value)}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button
            className="btn btn-glow"
            onClick={onAnalyze}
            disabled={isAnalyzing || candidatesCount === 0 || !jobReq}
          >
            {isAnalyzing ? (
              <>กำลังประมวลผล...</>
            ) : (
              <><Zap size={16} /> ให้ AI คัดกรองผู้สมัคร</>
            )}
          </button>
        </div>
      </div>

      {/* Candidate Database */}
      <div className="section-header">
        <div className="section-header-icon purple"><Database size={20} /></div>
        <div className="section-header-text">
          <h2>ฐานข้อมูลผู้สมัคร</h2>
          <p>โหลดไฟล์หรือจำลองข้อมูลผู้สมัครเพื่อทำการทดสอบ</p>
        </div>
      </div>

      <div className="tech-grid stagger-children">
        {/* Mock Data Card */}
        <div className="tech-card animate-slide-up">
          <div className="tech-card-icon" style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}>
            <Code size={22} />
          </div>
          <h4>โหมดข้อมูลจำลองพื้นฐาน</h4>
          <p className="text-secondary">ดึงข้อมูลตัวอย่าง 100 คนที่มีอยู่ในระบบเพื่อทดสอบทันที</p>
          <button className="btn btn-secondary w-full" style={{ justifyContent: 'center' }} onClick={handleLoadMockData}>
            <Database size={14} /> โหลดข้อมูลจำลอง 100 คน
          </button>
        </div>

        {/* Random Generate Card */}
        <div className="tech-card animate-slide-up">
          <div className="tech-card-icon" style={{ background: 'var(--warning-muted)', color: 'var(--warning)' }}>
            <Shuffle size={22} />
          </div>
          <h4>สุ่มสร้างข้อมูลใหม่</h4>
          <p className="text-secondary">ใช้ AI หรือ Script สุ่มสร้างข้อมูลผู้สมัครใหม่ 100 คนไม่ซ้ำเดิม</p>
          <button className="btn btn-secondary w-full" style={{ justifyContent: 'center' }} onClick={handleGenerateRandom}>
            <Shuffle size={14} /> สร้างสุ่ม 100 คน
          </button>
        </div>

        {/* Upload Card */}
        <div className="tech-card animate-slide-up">
          <div className="tech-card-icon" style={{ background: 'var(--success-muted)', color: 'var(--success)' }}>
            <Upload size={22} />
          </div>
          <h4>อัปโหลดเรซูเม่ของจริง</h4>
          <p className="text-secondary">
            ใช้ AI ดึงข้อมูลจากไฟล์ PDF หรือ TXT
            <span style={{ display: 'block', marginTop: '0.25rem', color: 'var(--warning)', fontSize: '0.75rem' }}>จำกัด: 1 ไฟล์ไม่เกิน 5 MB</span>
          </p>
          <label className={`btn btn-primary w-full ${isUploading ? '' : ''}`} style={{ justifyContent: 'center', cursor: isUploading ? 'wait' : 'pointer', opacity: isUploading ? 0.7 : 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%' }}>
              {isUploading ? 'ระบบ AI กำลังดึงข้อมูล...' : <><Upload size={14} /> เลือกไฟล์ (PDF/TXT)</>}
            </div>
            <input
              type="file"
              accept=".pdf,.txt"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </label>
        </div>
      </div>
    </div>
  );
};

export default JobRequirementsForm;
