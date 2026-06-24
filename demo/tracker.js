(function () {
  "use strict";

  var config = window.CausalFunnelTrackerConfig || {};
  var endpoint = config.endpoint || "http://localhost:4000/api/events";

  function getSessionId() {
    var key = "causalfunnel_session_id";
    var existing = localStorage.getItem(key);

    if (existing) return existing;

    var id =
      "cf_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2, 10);

    localStorage.setItem(key, id);
    return id;
  }

  var sessionId = getSessionId();

  function sendEvent(eventType, extra) {
    var payload = {
      sessionId: sessionId,
      eventType: eventType,
      pageUrl: window.location.href,
      timestamp: new Date().toISOString(),
      viewportWidth: window.innerWidth || null,
      viewportHeight: window.innerHeight || null,
      referrer: document.referrer || "",
      userAgent: navigator.userAgent || "",
      path: window.location.pathname || "",
      x: null,
      y: null
    };

    if (extra) {
      for (var key in extra) {
        if (Object.prototype.hasOwnProperty.call(extra, key)) {
          payload[key] = extra[key];
        }
      }
    }

    fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    })
      .then(function (response) {
        if (!response.ok) {
          return response.text().then(function (text) {
            throw new Error(response.status + " " + text);
          });
        }

        console.log("[CausalFunnel]", eventType, response.status);
      })
      .catch(function (error) {
        console.error("[CausalFunnel] failed:", eventType, error);
      });
  }

  function clickTargetLabel(target) {
    if (!target) return "";

    var text = (target.innerText || target.textContent || "").trim();
    var tag = (target.tagName || "").toLowerCase();

    return text
      ? tag + ":" + text.slice(0, 80)
      : tag;
  }

  window.addEventListener("load", function () {
    sendEvent("page_view");
  });

  document.addEventListener(
    "click",
    function (event) {
      sendEvent("click", {
        x: Number(event.clientX),
        y: Number(event.clientY),
        path: clickTargetLabel(event.target)
      });
    },
    true
  );
})();