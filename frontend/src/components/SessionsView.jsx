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
      .catch(err => console.error("API Fetch Error:", err));
  }, [apiBase]);

  const fetchSessionRouteTimeline = (sessionId) => {
    setSelectedSession(sessionId);
    fetch(`${apiBase}/sessions/${sessionId}`)
      .then(res => res.json())
      .then(data => setTimeline(data))
      .catch(err => console.error("API Timeline Error:", err));
  };

  if (loading) {
    return (
      <div class="flex flex-col items-center justify-center py-24 space-y-3">
        <div class="h-4 w-4 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-xs font-mono text-zinc-500">Streaming active database records...</p>
      </div>
    );
  }

  return (
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Columns: Sessions Ledger */}
      <div class="lg:col-span-5 bg-[#09090b] rounded-xl border border-zinc-800/80 overflow-hidden shadow-2xl">
        <div class="p-4 bg-[#141416]/60 border-b border-zinc-800/80 flex justify-between items-center">
          <h2 class="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">Identified Sessions [cite: 23, 31, 32]</h2>
          <span class="text-[10px] font-mono bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 text-zinc-400">
            {sessions.length} tracks
          </span>
        </div>
        
        <div class="divide-y divide-zinc-900 max-h-[72vh] overflow-y-auto custom-scrollbar">
          {sessions.map(sess => (
            <div 
              key={sess._id} 
              onClick={() => fetchSessionRouteTimeline(sess._id)}
              class={`p-4 cursor-pointer transition-all duration-150 relative ${selectedSession === sess._id ? 'bg-[#141416] border-l-2 border-white' : 'hover:bg-[#141416]/40'}`}
            >
              <div class="flex justify-between items-center mb-2">
                <span class="font-mono text-xs font-medium text-white tracking-tight">{sess._id} [cite: 32]</span>
                <span class="font-mono text-[10px] text-zinc-400 bg-zinc-900 border border-zinc-800/80 px-2 py-0.5 rounded-md">
                  {sess.totalEvents} events [cite: 23, 32]
                </span>
              </div>
              <div class="flex flex-col space-y-1">
                <p class="text-xs text-zinc-500 font-mono truncate"><span class="text-zinc-600">entry:</span> {sess.entryPage}</p>
                <p class="text-[10px] text-zinc-600 font-mono">
                  {new Date(sess.lastActive).toLocaleDateString()} at {new Date(sess.lastActive).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Columns: Telemetry Audit Log */}
      <div class="lg:col-span-7 bg-[#09090b] rounded-xl border border-zinc-800/80 p-5 min-h-[55vh] flex flex-col shadow-2xl">
        {selectedSession ? (
          <>
            <div class="mb-5 pb-4 border-b border-zinc-800 flex flex-col gap-1">
              <h3 class="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">User Journey Stream Pipeline [cite: 33]</h3>
              <p class="text-[11px] text-zinc-500 font-mono">ID: <span class="text-zinc-300">{selectedSession}</span> [cite: 12, 33]</p>
            </div>
            
            <div class="space-y-3 flex-1 overflow-y-auto pr-1 max-h-[62vh]">
              {timeline.map((event, index) => (
                <div key={event._id} class="flex items-start gap-4 p-3.5 bg-[#030303] border border-zinc-800/60 rounded-lg hover:border-zinc-700/80 transition-colors">
                  {/* Event Type Tickers */}
                  <div class="flex flex-col items-center justify-center pt-0.5">
                    <span class={`text-[9px] font-mono font-bold tracking-widest uppercase px-2 py-0.5 rounded border ${
                      event.eventType === 'page_view' 
                        ? 'bg-zinc-900 text-zinc-300 border-zinc-700' 
                        : 'bg-zinc-900 text-amber-400 border-amber-900/40'
                    }`}>
                      {event.eventType} [cite: 13]
                    </span>
                  </div>

                  {/* Core Structured Event Meta Metadata */}
                  <div class="flex-1 min-w-0 space-y-2">
                    <div class="flex justify-between items-center">
                      <p class="text-xs font-mono text-zinc-300 truncate break-all bg-[#09090b] px-2 py-1 rounded border border-zinc-900 max-w-full">
                        {event.url} [cite: 14]
                      </p>
                      <span class="text-[10px] font-mono text-zinc-600 shrink-0 ml-2">
                        +{index * 4}s
                      </span>
                    </div>

                    {event.eventType === 'click' && (
                      <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono text-zinc-500 bg-[#09090b]/40 p-2 rounded border border-zinc-900/60">
                        <span>matrix_x: <strong class="text-zinc-300 font-normal">{event.clickX}%</strong></span> [cite: 16]
                        <span>matrix_y: <strong class="text-zinc-300 font-normal">{event.clickY}%</strong></span> [cite: 16]
                        <span class="text-zinc-800">|</span>
                        <span>viewport: <span class="text-zinc-400">{event.screenSize || 'unknown'}</span></span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div class="flex-1 flex flex-col items-center justify-center text-center p-8 my-auto">
            <span class="font-mono text-xs text-zinc-600 border border-zinc-800/80 bg-zinc-900/20 px-3 py-1 rounded">
              awaiting_session_selection_stream
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
