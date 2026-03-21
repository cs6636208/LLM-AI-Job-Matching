import React from 'react';
import { ClipboardList, Trash2, UserCheck, Download } from 'lucide-react';

const ShortlistView = ({ shortlist, onRemove }) => {
  if (!shortlist || shortlist.length === 0) {
    return (
      <div className="flex-col items-center justify-center text-center h-full animate-fade-in" style={{ padding: '4rem 0' }}>
        <ClipboardList size={48} className="text-secondary mb-4 opacity-50" />
        <h3 className="text-secondary">No candidates shortlisted yet</h3>
        <p className="text-sm">Go to Direct Comparison and click "Shortlist" on candidates you are interested in.</p>
      </div>
    );
  }

  const handleExport = () => {
    const header = "Name,Role,Experience,Score,Matched Skills,Missing Skills\n";
    const rows = shortlist.map(c =>
      `"${c.name}","${c.currentRole}",${c.yearsOfExperience},${c.score},"${(c.matchedSkills || []).join('; ')}","${(c.missingSkills || []).join('; ')}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shortlist_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="flex items-center gap-2" style={{ marginBottom: 0 }}>
          <ClipboardList size={24} className="text-success" />
          Shortlisted Candidates ({shortlist.length})
        </h2>
        <button className="btn btn-secondary" onClick={handleExport}>
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div className="candidate-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {shortlist.map((candidate, index) => (
          <div key={candidate.id} className="glass-panel flex items-center justify-between" style={{ transition: 'transform 0.2s ease' }}>
            <div className="flex items-center gap-6" style={{ flex: 1 }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(16, 185, 129, 0.15)', border: '2px solid rgba(16, 185, 129, 0.3)',
                fontSize: '1.2rem', fontWeight: 700, color: 'var(--success-color)', flexShrink: 0
              }}>
                <UserCheck size={22} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 className="text-lg font-semibold" style={{ marginBottom: '0.25rem' }}>{candidate.name}</h3>
                <p className="text-sm text-secondary" style={{ marginBottom: '0.5rem' }}>
                  {candidate.currentRole} • {candidate.yearsOfExperience}y exp
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {(candidate.matchedSkills || []).slice(0, 5).map(skill => (
                    <span key={skill} style={{
                      background: 'rgba(34,197,94,0.12)', color: '#4ade80', fontSize: '0.75rem',
                      padding: '0.2rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(34,197,94,0.25)'
                    }}>
                      ✓ {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4" style={{ flexShrink: 0, marginLeft: '1rem' }}>
              <div style={{ textAlign: 'right' }}>
                <p className="text-xs text-secondary" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Score</p>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success-color)' }}>
                  {candidate.score}
                </div>
              </div>
              <button
                className="btn btn-danger"
                onClick={() => onRemove(candidate.id)}
                title="Remove from shortlist"
                style={{ padding: '0.5rem' }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShortlistView;
