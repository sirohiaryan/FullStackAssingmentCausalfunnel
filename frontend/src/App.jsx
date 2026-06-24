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
    <div class="min-h-screen bg-[#000000] text-[#f4f4f5] antialiased selection:bg-zinc-800 selection:text-white flex flex-col">
      {/* Top Professional Navigation Bar */}
      <header class="border-b border-zinc-800/80 bg-[#09090b] px-6 py-3.5 flex justify-between items-center sticky top-0 z-50 backdrop-blur-md">
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <div class="h-6 w-6 rounded bg-white flex items-center justify-center font-mono font-black text-xs text-black tracking-tighter">
              CF
            </div>
            <span class="text-sm font-semibold tracking-tight text-white">CausalFunnel Analytics</span>
          </div>
          <div class="h-4 w-px bg-zinc-800 hidden sm:block" />
          <span class="text-xs text-zinc-500 font-mono hidden sm:block">v1.0.0-production</span>
        </div>

        {/* Monochromatic Premium Tab System */}
        <div class="flex gap-1 bg-[#18181b] p-1 rounded-lg border border-zinc-800/60">
          <button 
            onClick={() => setActiveTab('sessions')}
            class={`px-3.5 py-1.5 rounded-md font-medium text-xs font-mono transition-all ${activeTab === 'sessions' ? 'bg-[#27272a] text-white border border-zinc-700/50 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            session_streams
          </button>
          <button 
            onClick={() => setActiveTab('heatmap')}
            class={`px-3.5 py-1.5 rounded-md font-medium text-xs font-mono transition-all ${activeTab === 'heatmap' ? 'bg-[#27272a] text-white border border-zinc-700/50 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            heatmap_layer
          </button>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main class="flex-1 p-6 max-w-7xl w-full mx-auto">
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
