import React, { useState, useEffect } from 'react';
import SessionsView from './components/SessionsView';
import HeatmapView from './components/HeatmapView';
import { initializeTracker } from './Tracker';

const API_BASE = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace('/events', '') 
  : 'http://localhost:5000/api';

function App() {
  const [activeTab, setActiveTab] = useState('sessions');

  useEffect(() => {
    initializeTracker();
  }, []);

  return (
    <div className="min-h-screen bg-[#000000] text-[#f4f4f5] antialiased flex flex-col">
      <header className="border-b border-zinc-800/80 bg-[#09090b] px-6 py-3.5 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 rounded bg-white flex items-center justify-center font-mono font-black text-[10px] text-black">CF</div>
          <span className="text-xs font-semibold font-mono tracking-tight text-white">causalfunnel_engine</span>
        </div>
        <div className="flex gap-1 bg-[#18181b] p-1 rounded-lg border border-zinc-800/60">
          <button 
            onClick={() => setActiveTab('sessions')} 
            className={`px-3 py-1 rounded font-mono text-[11px] transition-colors ${activeTab === 'sessions' ? 'bg-[#27272a] text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            session_streams
          </button>
          <button 
            onClick={() => setActiveTab('heatmap')} 
            className={`px-3 py-1 rounded font-mono text-[11px] transition-colors ${activeTab === 'heatmap' ? 'bg-[#27272a] text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            heatmap_layer
          </button>
        </div>
      </header>
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
        {activeTab === 'sessions' ? <SessionsView apiBase={API_BASE} /> : <HeatmapView apiBase={API_BASE} />}
      </main>
    </div>
  );
}

export default App;
