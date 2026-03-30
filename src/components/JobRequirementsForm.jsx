import React, { useState } from 'react';
import { Upload, Briefcase, Code, CheckCircle, Zap, Shuffle } from 'lucide-react';

const JobRequirementsForm = ({ jobReq, setJobReq, onAnalyze, isAnalyzing, candidatesCount, setCandidates, candidates }) => {

  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size limit (5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      alert("File size exceeds the 5MB limit. Please upload a smaller file.");
      e.target.value = '';
      return;
    }

    setIsUploading(true);
    try {
      const { extractResumeData } = await import('../services/llmClient.js');
      const newCandidate = await extractResumeData(file);

      // Save to backend immediately so returning users see it
      const token = localStorage.getItem('token');
      if (token) {
        await fetch('http://localhost:5000/api/candidates/bulk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ candidates: [newCandidate] })
        });
      }

      setCandidates(prev => [newCandidate, ...prev]);
      alert(`Successfully processed and added: ${newCandidate.name}`);
    } catch (err) {
      console.error(err);
      alert("Error parsing document. " + err.message);
    } finally {
      setIsUploading(false);
      e.target.value = ''; // Reset input
    }

  };

  const handleLoadMockData = async () => {
    try {
      const { mockResumes } = await import('../data/mockResumes.js');
      setCandidates(mockResumes);
      alert(`โหลดข้อมูล ${mockResumes.length} Mock Resume เสร็จเรียบร้อยแล้ว!`);
    } catch (err) {
      console.error(err);
      alert("Failed to load mock data. Ensure mock data script has been run.");
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
      alert("Failed to generate random mock data.");
    }
  };

  return (
    <div className="animate-fade-in">
      <h2 className="mb-4 flex items-center gap-2"><Briefcase size={24} className="text-accent" /> Job Requirements</h2>

      <div className="glass-panel mb-6">
        <label className="input-label mb-2 block">Describe the ideal candidate (Skills, Experience, Traits)</label>
        <textarea
          className="input-field w-full"
          rows="5"
          placeholder="e.g., We are looking for a Senior React Developer with at least 5 years of experience. Must know Node.js, Next.js, and be comfortable with mentoring juniors..."
          value={jobReq}
          onChange={(e) => setJobReq(e.target.value)}
        />
        <div className="flex justify-end mt-4">
          <button
            className="btn btn-primary"
            onClick={onAnalyze}
            disabled={isAnalyzing || candidatesCount === 0 || !jobReq}
          >
            {isAnalyzing ? (
              <>Analyzing Candidates...</>
            ) : (
              <><Zap size={18} /> Run AI Matcher</>
            )}
          </button>
        </div>
      </div>

      <div className="mt-10">
        <h3 className="mb-4 text-xl">Candidate Database</h3>
        <div className="glass-panel items-center justify-between mb-6">
          <div className="mb-4 pb-4 border-b border-white/10">
            <p className="font-semibold text-lg">{candidatesCount} Resumes in Pool</p>
            <p className="text-sm text-secondary">Extract data from documents or load mock data to evaluate.</p>
          </div>

          <div className="flex-grid mt-4">
            <div className="action-card p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <h4 className="flex items-center gap-2 mb-2"><Code size={18} className="text-accent" /> Mock Data Mode</h4>
              <p className="text-xs text-secondary mb-4 min-h-[40px]">Instantly populate the system with 100 auto-generated resumes for testing.</p>
              <button className="btn btn-secondary w-full justify-center" onClick={handleLoadMockData}>
                Load 100 Mock Resumes
              </button>
            </div>

            <div className="action-card p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <h4 className="flex items-center gap-2 mb-2"><Shuffle size={18} className="text-warning" /> Random Generate</h4>
              <p className="text-xs text-secondary mb-4 min-h-[40px]">Generate 100 fresh random resumes (no duplicates with existing pool).</p>
              <button className="btn btn-secondary w-full justify-center" onClick={handleGenerateRandom}>
                + Generate 100 Random
              </button>
            </div>

            <div className="action-card p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors relative overflow-hidden">
              <h4 className="flex items-center gap-2 mb-2"><Upload size={18} className="text-success" /> Upload Real Resume</h4>
              <p className="text-xs text-secondary mb-4 min-h-[40px]">
                Securely parse a local PDF or TXT resume.
                <span className="block mt-1 text-warning/80">Max limit: 1 file (Up to 5 MB)</span>
              </p>
              <label className={`btn btn-primary block text-center w-full min-h-[44px] leading-[44px] p-0 transition-all ${isUploading ? 'opacity-70 cursor-wait' : 'cursor-pointer hover:shadow-lg hover:shadow-success/30'}`}>
                <div className="w-full h-full flex items-center justify-center gap-2">
                  {isUploading ? 'Extracting via AI...' : <><Upload size={16} /> Choose File (PDF/TXT)</>}
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
      </div>
    </div>
  );
};

export default JobRequirementsForm;
