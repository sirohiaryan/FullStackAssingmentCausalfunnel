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
    // Initializing tracking scripts inside the client platform dashboard itself for demo testing
    initializeTracker();
  }, []);

  return (
    <div class="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col">
      {/* Top Header */}
      <header class="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur px-8 py-4 flex justify-between items-center">
        <div class="flex items-center gap-3">
          <div class="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-black tracking-tighter">
            CF
          </div>
          <h1 class="text-xl font-bold tracking-tight">CausalFunnel <span class="text-zinc-400 font-normal text-sm border-l border-zinc-700 pl-3">Behavior Engine</span></h1>
        </div>
        <div class="flex gap-2 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
          <button 
            onClick={() => setActiveTab('sessions')}
            class={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === 'sessions' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            Sessions Journey
          </button>
          <button 
            onClick={() => setActiveTab('heatmap')}
            class={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === 'heatmap' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            Heatmap Layer
          </button>
        </div>
      </header>

      {/* Main UI Arena */}
      <main class="flex-1 p-8 max-w-7xl w-full mx-auto">
        {activeTab === 'sessions' ? (
          <SessionsView apiBase={API_BASE} />
        ) : (
          <HeatmapView apiBase={API_BASE} />
        )}
      </main>
    </div>
  );
}

export default App;
