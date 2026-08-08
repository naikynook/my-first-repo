// site-ui.js
// About modal + digital-object tab switching for the studio shell

(function() {
  // --- About modal: open/close + Escape to dismiss ---
  const trigger = document.getElementById("about-trigger");
  const modal = document.getElementById("about-modal");
  if (trigger && modal) {
    function openAbout() {
      modal.hidden = false;
      document.body.classList.add("about-open");
    }

    function closeAbout() {
      modal.hidden = true;
      document.body.classList.remove("about-open");
    }

    trigger.addEventListener("click", openAbout);
    modal.querySelectorAll("[data-about-close]").forEach(function(el) {
      el.addEventListener("click", closeAbout);
    });
    document.addEventListener("keydown", function(event) {
      if (event.key === "Escape" && !modal.hidden) {
        closeAbout();
      }
    });
  }

  // --- Object tabs: activateTab, keyboard nav, hash routing, resize ---
  const tabs = Array.prototype.slice.call(document.querySelectorAll(".object-tab"));
  const panels = Array.prototype.slice.call(document.querySelectorAll(".object-panel"));
  if (!tabs.length || !panels.length) {
    return;
  }

  // Show one panel, sync ARIA/tabIndex, update URL hash, then nudge Mapbox/D3/Three to relayout
  function activateTab(tabId, focusTab) {
    tabs.forEach(function(tab) {
      const selected = tab.getAttribute("data-tab") === tabId;
      tab.classList.toggle("is-active", selected);
      tab.setAttribute("aria-selected", selected ? "true" : "false");
      tab.tabIndex = selected ? 0 : -1;
      if (selected && focusTab) {
        tab.focus();
      }
    });

    panels.forEach(function(panel) {
      const selected = panel.getAttribute("data-panel") === tabId;
      panel.classList.toggle("is-active", selected);
      if (selected) {
        panel.hidden = false;
      } else {
        panel.hidden = true;
      }
    });

    // Mapbox (and other libs) need a resize after a panel becomes visible
    window.requestAnimationFrame(function() {
      window.dispatchEvent(new Event("resize"));
      setTimeout(function() {
        window.dispatchEvent(new Event("resize"));
      }, 80);
    });

    // Keep #agents, #survey, etc. in the address bar for shareable deep links
    try {
      history.replaceState(null, "", "#" + tabId);
    } catch (e) {
      // ignore
    }
  }

  tabs.forEach(function(tab) {
    tab.addEventListener("click", function() {
      activateTab(tab.getAttribute("data-tab"), false);
    });

    tab.addEventListener("keydown", function(event) {
      // Arrow keys, Home, and End move focus between tabs (WAI-ARIA tablist pattern)
      const index = tabs.indexOf(tab);
      let next = null;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        next = tabs[(index + 1) % tabs.length];
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        next = tabs[(index - 1 + tabs.length) % tabs.length];
      } else if (event.key === "Home") {
        next = tabs[0];
      } else if (event.key === "End") {
        next = tabs[tabs.length - 1];
      }
      if (next) {
        event.preventDefault();
        activateTab(next.getAttribute("data-tab"), true);
      }
    });
  });

  // Open the tab named in the URL hash, or default to Agents
  const hash = (location.hash || "").replace(/^#/, "");
  const valid = tabs.some(function(tab) {
    return tab.getAttribute("data-tab") === hash;
  });
  activateTab(valid ? hash : "agents", false);
})();
