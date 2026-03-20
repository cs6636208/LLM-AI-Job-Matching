import React from 'react';
import { Zap, ThumbsUp, ThumbsDown, UserCheck } from 'lucide-react';

const ComparativeAnalysis = ({ results }) => {
  if (!results || !results.rankedCandidates) {
    return (
      <div className="flex-col items-center justify-center text-center h-full animate-fade-in" style={{ padding: '4rem 0' }}>
        <Zap size={48} className="text-secondary mb-4 opacity-50" />
        <h3 className="text-secondary">No comparison data</h3>
        <p className="text-sm">Run the AI Matcher to evaluate candidates.</p>
      </div>
    );
  }

  const topCandidates = results.rankedCandidates.slice(0, 5); // Ensure top 5 are compared per requirement

  return (
    <div className="animate-fade-in">
      <h2 className="mb-6 flex items-center gap-2">
        <Zap size={24} className="text-accent" /> 
        AI Comparative Analysis (Top 5)
      </h2>
      
      <div className="comparison-grid flex-grid text-left" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {topCandidates.map((candidate, idx) => (
          <div key={candidate.id} className={`glass-panel flex-col ${idx === 0 ? 'border-accent' : ''}`} style={idx === 0 ? { borderColor: 'var(--accent-color)', padding: '1.75rem' } : { padding: '1.75rem' }}>
            <div className="text-center mb-6 border-b pb-4" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              {idx === 0 && <span className="bg-accent text-white text-xs px-2 py-1 rounded-full absolute -top-3 left-1/2 transform -translate-x-1/2 shadow-lg shadow-blue-500/50">Auto-Selected Best</span>}
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 text-2xl font-bold mb-3">
                {candidate.score}
              </div>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.35rem' }}>{candidate.name}</h3>
              <p className="text-sm text-secondary" style={{ marginBottom: 0 }}>{candidate.currentRole}</p>
            </div>
            
            <div className="flex-1">
              <div className="mb-6">
                <h4 className="flex items-center gap-2 text-success mb-3" style={{ fontSize: '0.95rem' }}><ThumbsUp size={16} /> Pros</h4>
                <ul className="text-sm text-secondary list-disc pl-4 space-y-2" style={{ lineHeight: '1.8' }}>
                  {candidate.pros.map((pro, i) => <li key={i}>{pro}</li>)}
                </ul>
              </div>
              
              <div>
                <h4 className="flex items-center gap-2 text-danger mb-3" style={{ fontSize: '0.95rem' }}><ThumbsDown size={16} /> Cons / Gaps</h4>
                <ul className="text-sm text-secondary list-disc pl-4 space-y-2" style={{ lineHeight: '1.8' }}>
                  {candidate.cons.map((con, i) => <li key={i}>{con}</li>)}
                </ul>
              </div>
            </div>
            
            <button className={`btn mt-6 w-full ${idx === 0 ? 'btn-primary' : 'btn-secondary'}`}>
              <UserCheck size={16} /> Shortlist
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ComparativeAnalysis;
