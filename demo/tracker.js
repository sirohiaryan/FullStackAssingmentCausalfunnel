(function () {
  "use strict";

  const config = window.CausalFunnelTrackerConfig || {};
  const endpoint = config.endpoint || "http://localhost:4000/api/events";
  const storageKey = "causalfunnel_session_id";

  function getSessionId() {
    let sessionId = sessionStorage.getItem(storageKey);

    if (!sessionId) {
      sessionId =
        (window.crypto &&
          window.crypto.randomUUID &&
          window.crypto.randomUUID()) ||
        `cf_${Date.now()}_${Math.random().toString(16).slice(2)}`;

      sessionStorage.setItem(storageKey, sessionId);
    }

    return sessionId;
  }

  const sessionId = getSessionId();

  function getCleanPath() {
    const path = window.location.pathname || "/";

    if (
      path.includes("C:/") ||
      path.includes("C%3A") ||
      window.location.protocol === "file:"
    ) {
      return "/";
    }

    return path === "/index.html" ? "/" : path;
  }

  function send(payload) {
    const body = JSON.stringify(payload);

    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([body], {
          type: "application/json",
        });

        if (navigator.sendBeacon(endpoint, blob)) {
          return;
        }
      }
    } catch (_) {
      // Use fetch if sendBeacon is unavailable.
    }

    fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
      keepalive: true,
    }).catch(() => {
      // Tracking must never affect storefront behavior.
    });
  }

  function basePayload(eventType) {
    const path = getCleanPath();

    return {
      sessionId,
      eventType,
      pageUrl: path,
      path,
      timestamp: new Date().toISOString(),
      referrer: document.referrer || "",
      userAgent: navigator.userAgent || "",
    };
  }

  function track(eventName, properties = {}) {
    send({
      ...basePayload("click"),
      funnelEvent: true,
      eventName,
      properties,
    });
  }

  function trackPageView() {
    send({
      ...basePayload("page_view"),
      funnelEvent: true,
      eventName: "page_view",
      properties: {
        title: document.title,
      },
    });
  }

  function trackRawClick(event) {
    const target = event.target;

    send({
      ...basePayload("click"),
      funnelEvent: false,
      eventName: "raw_click",
      x: Math.round(event.clientX),
      y: Math.round(event.clientY),
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      properties: {
        tagName: target?.tagName || "",
        id: target?.id || "",
        className:
          typeof target?.className === "string"
            ? target.className.slice(0, 160)
            : "",
        text:
          typeof target?.textContent === "string"
            ? target.textContent.trim().slice(0, 120)
            : "",
      },
    });
  }

  window.CausalFunnel = {
    track,
    getSessionId: () => sessionId,
    getPagePath: getCleanPath,
  };

  document.addEventListener("click", trackRawClick, {
    capture: true,
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", trackPageView, {
      once: true,
    });
  } else {
    trackPageView();
  }
})();