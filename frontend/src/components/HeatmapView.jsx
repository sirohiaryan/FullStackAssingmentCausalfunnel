import React, { useState, useEffect } from 'react';

export default function HeatmapView({ apiBase }) {
  const [targetUrl, setTargetUrl] = useState('https://demo-shop.com/');
  const [clickPoints, setClickPoints] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${apiBase}/heatmap?url=${encodeURIComponent(targetUrl)}`)
      .then(res => res.json())
      .then(data => {
        setClickPoints(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error mapping heatmap logs:", err);
        setLoading(false);
      });
  }, [targetUrl, apiBase]);

  return (
    <div class="space-y-6">
      {/* Control Action Header */}
      <div class="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 class="font-bold text-zinc-100">Page Click Hotspot Map Overlay</h2>
          <p class="text-xs text-zinc-400">Isolating relative micro-coordinate actions natively across viewports.</p>
        </div>
        <div class="flex items-center gap-2 w-full md:w-auto">
          <label class="text-xs text-zinc-400 font-mono whitespace-nowrap">Filter URL:</label>
          <select 
            value={targetUrl} 
            onChange={(e) => setTargetUrl(e.target.value)}
            class="bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono px-3 py-2 text-zinc-200 outline-none focus:border-emerald-500 w-full md:w-72"
          >
            <option value="https://demo-shop.com/">https://demo-shop.com/</option>
            <option value="https://demo-shop.com/products">https://demo-shop.com/products</option>
            <option value="https://demo-shop.com/cart">https://demo-shop.com/cart</option>
          </select>
        </div>
      </div>

      {/* Render Heatmap Canvas Frame Layout */}
      <div class="bg-zinc-900 rounded-2xl border border-zinc-800 p-4 relative overflow-hidden flex flex-col items-center">
        <div class="w-full flex justify-between items-center text-xs text-zinc-500 font-mono mb-2 px-1">
          <span>Target Context Canvas Matrix (Responsive Body Space)</span>
          <span class="text-emerald-400 font-semibold">{clickPoints.length} total hot-clicks logged</span>
        </div>

        {/* Heatmap Visual Sandbox Frame */}
        <div class="w-full max-w-5xl aspect-video rounded-xl bg-zinc-950 border border-zinc-800/80 relative shadow-inner overflow-hidden group">
          {/* Mock page structural shadows inside canvas to create a brilliant visualization */}
          <div class="absolute inset-x-0 top-0 h-12 bg-zinc-900/40 border-b border-zinc-800/40 flex items-center px-4 justify-between pointer-events-none opacity-40">
            <div class="flex gap-1.5">
              <div class="h-2.5 w-2.5 rounded-full bg-zinc-700" />
              <div class="h-2.5 w-2.5 rounded-full bg-zinc-700" />
              <div class="h-2.5 w-2.5 rounded-full bg-zinc-700" />
            </div>
            <div class="w-1/3 h-4 bg-zinc-800 rounded-md" />
            <div class="w-12 h-4 bg-zinc-800 rounded-md" />
          </div>

          {loading ? (
            <div class="absolute inset-0 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm z-50 text-zinc-400 text-xs font-mono">
              Recalculating absolute plot coordinate geometry vectors...
            </div>
          ) : clickPoints.length === 0 ? (
            <div class="absolute inset-0 flex items-center justify-center text-zinc-600 text-sm font-mono">
              No click matrix coordinates tracked for this route interface.
            </div>
          ) : (
            // Absolute Coordinates Placement Matrix System
            clickPoints.map((point) => (
              <div
                key={point._id}
                style={{
                  position: 'absolute',
                  left: `${point.clickX}%`,
                  top: `${point.clickY}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                class="absolute h-5 w-5 rounded-full pointer-events-none mix-blend-screen transition-all duration-500"
              >
                {/* Glowing Heat Core */}
                <div class="absolute inset-0 rounded-full bg-amber-500 opacity-60 blur-[3px] animate-pulse" />
                <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-red-400" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
