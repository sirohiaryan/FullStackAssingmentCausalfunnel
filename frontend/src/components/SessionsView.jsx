import React, { useState, useEffect } from 'react';

export default function SessionsView({ apiBase }) {
  const [sessions, setSessions] = useState([]);
  const [selected, setSelected] = useState(null);
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

  const loadStream = (id) => {
    setSelected(id);
    fetch(`${apiBase}/sessions/${id}`)
      .then(res => res.json())
      .then(data => setTimeline(data))
      .catch(err => console.error("Timeline Fetch Error:", err));
  };

  if (loading) {
    return (
      <div className="text-center font-mono text-xs text-zinc-500 py-12">
        loading_telemetry_pipeline...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left List Pane */}
      <div className="lg:col-span-5 bg-[#09090b] rounded-xl border border-zinc-800/80 overflow-hidden shadow-xl">
        <div className="p-3 bg-[#141416]/60 border-b border-zinc-800/80 font-mono text-[10px] text-zinc-400 uppercase tracking-wider flex justify-between items-center">
          <span>Identified Tracks</span>
          <span className="text-zinc-500">({sessions.length})</span>
        </div>
        <div className="divide-y divide-zinc-900 max-h-[70vh] overflow-y-auto">
          {sessions.map(s => (
            <div 
              key={s._id} 
              onClick={() => loadStream(s._id)} 
              className={`p-4 cursor-pointer text-xs font-mono transition-colors ${selected === s._id ? 'bg-[#141416] border-l-2 border-white' : 'hover:bg-[#141416]/30'}`}
            >
              <div className="flex justify-between text-white mb-1">
                <span className="truncate max-w-[70%]">{s._id}</span>
                <span className="text-zinc-500 text-[11px] shrink-0">{s.totalEvents} events</span>
              </div>
              <p className="text-[11px] text-zinc-500 truncate">route: {s.entryPage}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Stream Pane */}
      <div className="lg:col-span-7 bg-[#09090b] rounded-xl border border-zinc-800/80 p-5 min-h-[50vh] shadow-xl">
        {selected ? (
          <div className="space-y-3 max-h-[68vh] overflow-y-auto pr-1">
            <div className="mb-4 pb-2 border-b border-zinc-800 font-mono text-xs text-zinc-400">
              Active Session: <span className="text-white font-bold">{selected}</span>
            </div>
            {timeline.map((e) => (
              <div key={e._id} className="p-3 bg-[#030303] border border-zinc-800/60 rounded-md font-mono text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className={`uppercase text-[9px] font-bold border px-1.5 py-0.5 rounded ${e.eventType === 'page_view' ? 'text-zinc-300 bg-zinc-900 border-zinc-700' : 'text-amber-400 bg-zinc-900 border-amber-900/40'}`}>
                    {e.eventType}
                  </span>
                  <span className="text-zinc-600 text-[10px]">{new Date(e.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-zinc-300 break-all bg-black/40 p-2 rounded text-[11px] border border-zinc-900">{e.url}</p>
                {e.eventType === 'click' && (
                  <p className="text-[10px] text-zinc-500 bg-[#09090b]/60 p-1.5 rounded border border-zinc-900/40">
                    coordinates: X({e.clickX}%) Y({e.clickY}%) | viewport: {e.screenSize || 'N/A'}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-center py-24">
            <span className="font-mono text-xs text-zinc-600 border border-zinc-800/80 bg-zinc-900/20 px-3 py-1.5 rounded">
              awaiting_session_selection_stream
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
