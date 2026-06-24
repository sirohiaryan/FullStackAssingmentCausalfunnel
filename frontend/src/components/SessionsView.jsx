
import React, { useState, useEffect } from 'react';

export default function SessionsView({ apiBase }) {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${apiBase}/sessions`)
      .then(res => res.json())
      .then(data => {
        setSessions(data);
        setLoading(false);
      })
      .catch(err => console.error("Error pulling session lists:", err));
  }, [apiBase]);

  const viewSessionJourney = (sessionId) => {
    setSelectedSession(sessionId);
    fetch(`${apiBase}/sessions/${sessionId}`)
      .then(res => res.json())
      .then(data => setTimeline(data))
      .catch(err => console.error("Error pull timeline details:", err));
  };

  if (loading) return <div class="text-zinc-400 text-center py-12 animate-pulse text-lg">Retrieving session telemetry streams...</div>;

  return (
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Session Aggregation Grid */}
      <div class="lg:col-span-1 bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
        <div class="p-4 bg-zinc-800/40 border-b border-zinc-800">
          <h2 class="font-semibold text-zinc-200">Active User Tracks</h2>
        </div>
        <div class="divide-y divide-zinc-800/60 max-h-[70vh] overflow-y-auto">
          {sessions.map(sess => (
            <div 
              key={sess._id} 
              onClick={() => viewSessionJourney(sess._id)}
              class={`p-4 cursor-pointer transition-all ${selectedSession === sess._id ? 'bg-emerald-500/10 border-l-4 border-emerald-500' : 'hover:bg-zinc-800/40'}`}
            >
              <div class="flex justify-between items-center mb-1">
                <span class="font-mono text-sm font-semibold text-zinc-300">{sess._id}</span>
                <span class="bg-zinc-800 px-2.5 py-0.5 rounded-full text-xs font-medium text-emerald-400 border border-emerald-900/40">
                  {sess.totalEvents} actions
                </span>
              </div>
              <p class="text-xs text-zinc-500 truncate mt-1">Entry: {sess.entryPage}</p>
              <span class="text-[10px] text-zinc-500">{new Date(sess.lastActive).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Ordered Timeline Stream View */}
      <div class="lg:col-span-2 bg-zinc-900 rounded-2xl border border-zinc-800 p-6 flex flex-col min-h-[50vh]">
        {selectedSession ? (
          <>
            <div class="mb-6 pb-4 border-b border-zinc-800 flex justify-between items-center">
              <div>
                <h3 class="text-lg font-bold">User Stream Journey</h3>
                <p class="text-xs text-zinc-500 font-mono">Session ID: {selectedSession}</p>
              </div>
            </div>
            
            <div class="relative border-l border-zinc-700 ml-4 space-y-6 flex-1 overflow-y-auto pr-2">
              {timeline.map((event, index) => (
                <div key={event._id} class="relative pl-6 group">
                  {/* Timeline Node Icon */}
                  <div class={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-4 border-zinc-900 ${event.eventType === 'page_view' ? 'bg-sky-400' : 'bg-amber-400'}`} />
                  
                  <div class="bg-zinc-950 p-4 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all shadow-sm">
                    <div class="flex justify-between items-start mb-1">
                      <span class={`text-xs uppercase px-2 py-0.5 rounded font-mono font-bold ${event.eventType === 'page_view' ? 'bg-sky-500/10 text-sky-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {event.eventType}
                      </span>
                      <span class="text-xs text-zinc-500 font-mono">{new Date(event.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p class="text-sm font-medium text-zinc-300 break-all mt-2 font-mono bg-zinc-900/50 p-2 rounded border border-zinc-800/40">{event.url}</p>
                    
                    {event.eventType === 'click' && (
                      <div class="mt-2 text-xs text-zinc-500 flex items-center gap-3 bg-zinc-900/30 p-1.5 rounded">
                        <span class="font-mono">X Target: <strong class="text-zinc-300">{event.clickX}%</strong></span>
                        <span class="font-mono">Y Target: <strong class="text-zinc-300">{event.clickY}%</strong></span>
                        <span class="text-zinc-600">|</span>
                        <span class="text-zinc-400">Viewport: {event.screenSize || 'N/A'}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div class="flex-1 flex flex-col items-center justify-center text-zinc-500 py-12">
            <svg class="h-12 w-12 text-zinc-700 mb-3" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.042 9.152c.582.448 1.148.89 1.676 1.345m-7.425-.339l-.502-.501m.502.501a4.812 4.812 0 116.804 6.804M8.118 10.165a4.812 4.812 0 005.14 5.14M8.118 10.165l-1.954-1.955m3.754 3.754L6.42 17.584m-1.121-1.121l1.121-1.121M10.5 10.5L6.42 6.42m0 0l-1.12 1.12M6.42 6.42l1.12-1.12" />
            </svg>
            <p class="text-sm">Select an active session track entry on the left panel to isolate the user journey layout.</p>
          </div>
        )}
      </div>
    </div>
  );
}
