(function () {
  const endpoint =
    window.CausalFunnelTrackerConfig?.endpoint ||
    "http://localhost:4000/api/events";

  const sessionKey = "causalfunnel_session_id";
  let sessionId = localStorage.getItem(sessionKey);

  if (!sessionId) {
    sessionId =
      "sess_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
    localStorage.setItem(sessionKey, sessionId);
  }

  function sendEvent(eventType, extra) {
    const payload = {
      sessionId,
      eventType,
      pageUrl: window.location.href,
      referrer: document.referrer || null,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      ...extra,
    };

    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    })
      .then((response) => {
        console.log("[CausalFunnel] event", eventType, response.status, payload);
      })
      .catch((error) => {
        console.error("[CausalFunnel] tracking failed", error);
      });
  }

  function getTargetLabel(target) {
    if (!(target instanceof Element)) return "unknown";

    const clickable = target.closest("button, a, input, [role='button']");
    if (!clickable) return target.tagName.toLowerCase();

    return (
      clickable.getAttribute("aria-label") ||
      clickable.id ||
      clickable.textContent?.trim().replace(/\s+/g, " ").slice(0, 80) ||
      clickable.tagName.toLowerCase()
    );
  }

  window.addEventListener("load", function () {
    sendEvent("page_view", {
      x: null,
      y: null,
      target: "page_load",
    });
  });

  document.addEventListener(
    "click",
    function (event) {
      sendEvent("click", {
        x: Math.round(event.clientX),
        y: Math.round(event.clientY),
        target: getTargetLabel(event.target),
      });
    },
    true
  );
})();