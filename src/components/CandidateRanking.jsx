import React from 'react';
import { Trophy, Star, TrendingUp, AlertCircle } from 'lucide-react';

const CandidateRanking = ({ results }) => {
  if (!results || !results.rankedCandidates) {
    return (
      <div className="flex-col items-center justify-center text-center h-full animate-fade-in" style={{ padding: '4rem 0' }}>
        <Trophy size={48} className="text-secondary mb-4 opacity-50" />
        <h3 className="text-secondary">No rankings available</h3>
        <p className="text-sm">Run the AI Matcher first to see candidate rankings.</p>
      </div>
    );
  }

  const { rankedCandidates } = results;
  const top5 = rankedCandidates.slice(0, 5);

  const getScoreClass = (score) => {
    if (score >= 80) return 'score-high';
    if (score >= 60) return 'score-medium';
    return 'score-low';
  };

  return (
    <div className="animate-fade-in">
      <h2 className="mb-6 flex items-center gap-2">
        <Trophy size={24} className="text-warning" /> 
        Top Candidates Ranked (Top 5)
      </h2>
      
      <div className="candidate-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {top5.map((candidate, index) => {
          const medals = ['🥇', '🥈', '🥉'];
          const medalColors = [
            'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,215,0,0.05))',
            'linear-gradient(135deg, rgba(192,192,192,0.15), rgba(192,192,192,0.05))',
            'linear-gradient(135deg, rgba(205,127,50,0.15), rgba(205,127,50,0.05))'
          ];
          const isTop3 = index < 3;

          return (
          <div key={candidate.id} className="candidate-card glass-panel flex items-center justify-between" 
               style={{ background: isTop3 ? medalColors[index] : undefined, transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}>
            <div className="flex items-center gap-6" style={{ flex: 1 }}>
              
              {/* Rank Number Badge */}
              <div style={{ 
                width: 52, height: 52, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isTop3 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                border: isTop3 ? '2px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.1)',
                fontSize: isTop3 ? '1.5rem' : '1.1rem', fontWeight: 700, flexShrink: 0,
                color: isTop3 ? '#fff' : 'var(--text-secondary)'
              }}>
                {isTop3 ? medals[index] : `#${index + 1}`}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 className="text-lg font-semibold flex items-center gap-2" style={{ marginBottom: '0.25rem' }}>
                  {candidate.name} 
                  {index === 0 && <Star size={16} fill="var(--warning-color)" className="text-warning" />}
                </h3>
                <p className="text-sm text-secondary" style={{ marginBottom: '0.5rem' }}>{candidate.currentRole} • {candidate.yearsOfExperience}y exp</p>
                <div className="skills" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {candidate.matchedSkills.slice(0, 4).map(skill => (
                    <span key={skill} style={{ 
                      background: 'rgba(34,197,94,0.12)', color: '#4ade80', fontSize: '0.75rem',
                      padding: '0.2rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(34,197,94,0.25)'
                    }}>
                      ✓ {skill}
                    </span>
                  ))}
                  {candidate.missingSkills.length > 0 && (
                    <span style={{
                      background: 'rgba(239,68,68,0.12)', color: '#f87171', fontSize: '0.75rem',
                      padding: '0.2rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.25)'
                    }}>
                      ✗ {candidate.missingSkills[0]}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '1rem' }}>
              <p className="text-xs text-secondary" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Match Score</p>
              <div className={`score-badge ${getScoreClass(candidate.score)}`} style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                {candidate.score}
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
};

export default CandidateRanking;
