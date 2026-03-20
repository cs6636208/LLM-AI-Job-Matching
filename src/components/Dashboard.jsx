import React, { useState } from 'react';
import { Upload, Users, Search, Zap, CheckCircle, AlertTriangle } from 'lucide-react';
import JobRequirementsForm from './JobRequirementsForm';
import CandidateRanking from './CandidateRanking';
import ComparativeAnalysis from './ComparativeAnalysis';
import { analyzeCandidates } from '../services/llmClient';

const Dashboard = ({ candidates, setCandidates }) => {
  const [activeTab, setActiveTab] = useState('requirements'); // 'requirements', 'ranking', 'comparison'
  const [jobReq, setJobReq] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);

  const handleRunAnalysis = async (autoSelect = false) => {
    if (!jobReq.trim()) {
      alert("Please enter job requirements.");
      return;
    }
    if (candidates.length === 0) {
      alert("Please add some mock candidates first by clicking 'Load 100 Mock Resumes'.");
      return;
    }

    setIsAnalyzing(true);
    try {
      // Pick 20 top candidates randomly or let LLM evaluate the pool
      // Send ALL candidates to the LLM (up to 100 mock + any uploaded)
      const candidateSubset = candidates;
      
      const response = await analyzeCandidates(jobReq, candidateSubset);
      setAnalysisResults(response);
      setActiveTab(autoSelect === true ? 'comparison' : 'ranking');
    } catch (error) {
      console.error(error);
      alert('Error analyzing candidates: ' + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="dashboard-layout animate-fade-in">
      <div className="sidebar glass-panel">
        <h3 className="sidebar-title">Workflow</h3>
        <nav className="sidebar-nav">
          <button 
            className={`nav-btn ${activeTab === 'requirements' ? 'active' : ''}`}
            onClick={() => setActiveTab('requirements')}
          >
            <Search size={18} /> Requirements
          </button>
          <button 
            className={`nav-btn ${activeTab === 'ranking' ? 'active' : ''}`}
            onClick={() => setActiveTab('ranking')}
            disabled={!analysisResults}
          >
            <Users size={18} /> Rankings
          </button>
          <button 
            className={`nav-btn ${activeTab === 'comparison' ? 'active' : ''}`}
            onClick={() => setActiveTab('comparison')}
            disabled={!analysisResults}
          >
            <Zap size={18} /> Direct Comparison
          </button>
        </nav>
        
        <div className="auto-selector-card glass-panel mt-6 border-warning/30" style={{ padding: '1.25rem' }}>
          <h4 className="text-warning" style={{ marginBottom: '0.5rem', fontSize: '1.05rem', whiteSpace: 'nowrap' }}>Auto-Selector Mode</h4>
          <p className="text-sm" style={{ lineHeight: '1.7', marginBottom: '0.75rem' }}>Let AI instantly pick and compare the absolute best candidates.</p>
          <button className="btn btn-primary w-full mt-2" onClick={() => handleRunAnalysis(true)} disabled={isAnalyzing}>
            {isAnalyzing ? 'Analyzing...' : 'Auto-Select Best'}
          </button>
        </div>
      </div>

      <div className="main-panel glass-panel">
        {activeTab === 'requirements' && (
          <JobRequirementsForm 
            jobReq={jobReq} 
            setJobReq={setJobReq} 
            onAnalyze={handleRunAnalysis}
            isAnalyzing={isAnalyzing}
            candidatesCount={candidates.length}
            setCandidates={setCandidates}
          />
        )}
        
        {activeTab === 'ranking' && (
          <CandidateRanking results={analysisResults} />
        )}

        {activeTab === 'comparison' && (
          <ComparativeAnalysis results={analysisResults} />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
