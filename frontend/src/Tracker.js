const TRACKER_CONFIG = {
  // Gracefully switches dynamically contextually between dev environment and production
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/events'
};

export const initializeTracker = () => {
  if (typeof window === 'undefined') return;

  // Retrieve or assign Session Token
  let sessionId = localStorage.getItem('cf_session_id');
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('cf_session_id', sessionId);
  }

  const dispatchEvent = async (payload) => {
    try {
      await fetch(TRACKER_CONFIG.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          screenSize: `${window.innerWidth}x${window.innerHeight}`,
          ...payload
        })
      });
    } catch (err) {
      console.warn('Analytics tracking ingestion background skip:', err);
    }
  };

  // 1. Capture Page View Lifecycle
  dispatchEvent({ eventType: 'page_view' });

  // 2. Capture Click Matrix (Normalized to Document Coordinates Screen Agnostic)
  window.addEventListener('click', (e) => {
    const docWidth = document.documentElement.scrollWidth || document.body.scrollWidth;
    const docHeight = document.documentElement.scrollHeight || document.body.scrollHeight;

    const clickX = parseFloat(((e.pageX / docWidth) * 100).toFixed(2));
    const clickY = parseFloat(((e.pageY / docHeight) * 100).toFixed(2));

    dispatchEvent({
      eventType: 'click',
      clickX,
      clickY
    });
  });
};
