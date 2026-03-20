import React, { useState } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';

function App() {
  const [candidates, setCandidates] = useState([]);

  return (
    <div className="app-container relative overflow-hidden">
      <div className="bg-orb orb-1"></div>
      <div className="bg-orb orb-2"></div>
      
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section group cursor-pointer">
            <div className="logo-icon text-3xl group-hover:scale-110 transition-transform duration-300">🌪️</div>
            <h1 className="text-gradient font-bold tracking-tight">LLM-Powered Job Matching and Candidate Analysis System</h1>
          </div>
        </div>
      </header>

      <main className="main-content">
        <Dashboard 
          candidates={candidates} 
          setCandidates={setCandidates} 
        />
      </main>
    </div>
  );
}

export default App;
