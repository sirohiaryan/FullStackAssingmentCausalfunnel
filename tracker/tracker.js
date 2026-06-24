(function () {
  const CONFIG = window.CausalFunnelTrackerConfig || {};
  const ENDPOINT = CONFIG.endpoint || "http://localhost:4000/api/events";
  const STORAGE_KEY = CONFIG.storageKey || "cf_session_id";

  function uuid() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function getSessionId() {
    try {
      let id = localStorage.getItem(STORAGE_KEY);
      if (!id) {
        id = uuid();
        localStorage.setItem(STORAGE_KEY, id);
      }
      return id;
    } catch (e) {
      const match = document.cookie.match(new RegExp("(?:^|; )" + STORAGE_KEY + "=([^;]*)"));
      if (match && match[1]) return decodeURIComponent(match[1]);
      const id = uuid();
      document.cookie = STORAGE_KEY + "=" + encodeURIComponent(id) + "; path=/; max-age=31536000";
      return id;
    }
  }

  const sessionId = getSessionId();

  function send(payload) {
    const body = JSON.stringify(payload);

    if (navigator.sendBeacon) {
      try {
        const blob = new Blob([body], { type: "application/json" });
        navigator.sendBeacon(ENDPOINT, blob);
        return;
      } catch (e) {}
    }

    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
      mode: "cors",
    }).catch(function () {});
  }

  function basePayload(type) {
    return {
      session_id: sessionId,
      event_type: type,
      page_url: window.location.href,
      timestamp: new Date().toISOString(),
      referrer: document.referrer || "",
      userAgent: navigator.userAgent || "",
      path: window.location.pathname + window.location.search + window.location.hash,
      viewportWidth: window.innerWidth || null,
      viewportHeight: window.innerHeight || null,
    };
  }

  function trackPageView() {
    send(basePayload("page_view"));
  }

  function trackClick(e) {
    send(
      Object.assign(basePayload("click"), {
        x: Math.round(e.clientX),
        y: Math.round(e.clientY),
      })
    );
  }

  window.addEventListener("load", trackPageView, { once: true });
  document.addEventListener("click", trackClick, true);

  window.CausalFunnelTracker = {
    sessionId: sessionId,
    trackPageView: trackPageView,
    trackClick: trackClick,
  };
})();
