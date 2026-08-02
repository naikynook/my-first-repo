// Agents chatbot — p5.js / Three.js projector-art assistant
// Firebase syncs messages; OpenAI runs only on a Cloud Function (key never in the browser).

document.addEventListener("DOMContentLoaded", function() {
  const firebaseConfig = window.FIREBASE_CONFIG;
  const chatRoot = document.getElementById("agents-chat");
  const messagesEl = document.getElementById("chat-messages");
  const formEl = document.getElementById("chat-form");
  const inputEl = document.getElementById("chat-input");
  const sendBtn = document.getElementById("chat-send");
  const statusEl = document.getElementById("chat-status");

  // Gen2 HTTP function (not callable) — works reliably from GitHub Pages
  const AGENT_URL =
    "https://us-central1-design-workflows-ed79d.cloudfunctions.net/chatAgent";

  if (!chatRoot || !messagesEl || !formEl || !inputEl) {
    return;
  }

  if (typeof firebase === "undefined" || !firebaseConfig) {
    setStatus("Firebase could not be loaded.", true);
    return;
  }

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  const database = firebase.database();
  const messagesRef = database.ref("chat/messages");

  let busy = false;
  let recentContext = [];
  let pendingBubble = null;

  function setStatus(text, isError) {
    if (!statusEl) {
      return;
    }
    statusEl.textContent = text;
    statusEl.classList.toggle("is-error", !!isError);
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatMessageBody(text) {
    const escaped = escapeHtml(text);
    return escaped
      .replace(/```([\s\S]*?)```/g, '<pre class="chat-code"><code>$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code class="chat-inline">$1</code>')
      .replace(/\n/g, "<br>");
  }

  function showPending() {
    removePending();
    const empty = messagesEl.querySelector(".chat-empty");
    if (empty) {
      empty.remove();
    }
    pendingBubble = document.createElement("div");
    pendingBubble.className = "chat-bubble chat-bubble--bot chat-bubble--pending";
    pendingBubble.innerHTML =
      '<div class="chat-bubble-meta">agent</div>' +
      '<div class="chat-bubble-body">composing…</div>';
    messagesEl.appendChild(pendingBubble);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function removePending() {
    if (pendingBubble && pendingBubble.parentNode) {
      pendingBubble.parentNode.removeChild(pendingBubble);
    }
    pendingBubble = null;
  }

  function renderMessages(messagesObj) {
    const list = [];
    if (messagesObj) {
      Object.keys(messagesObj).forEach(function(key) {
        const msg = messagesObj[key];
        if (!msg || !msg.text) {
          return;
        }
        list.push({
          id: key,
          text: msg.text,
          sender: msg.sender === "bot" ? "bot" : "user",
          timestamp: msg.timestamp || 0
        });
      });
    }

    list.sort(function(a, b) {
      return a.timestamp - b.timestamp;
    });

    recentContext = list.slice(-8).map(function(msg) {
      return {
        role: msg.sender === "bot" ? "assistant" : "user",
        content: msg.text
      };
    });

    if (!list.length && !busy) {
      messagesEl.innerHTML =
        '<div class="chat-empty">' +
          "<p>Ask about a projection sketch — grids, spheres, waves, shaders-lite, or Three.js scenes.</p>" +
          '<p class="chat-empty-hint">try: “p5 full-bleed pulse grid for a dark gallery wall”</p>' +
        "</div>";
      return;
    }

    messagesEl.innerHTML = list
      .map(function(msg) {
        const label = msg.sender === "bot" ? "agent" : "you";
        return (
          '<div class="chat-bubble chat-bubble--' + msg.sender + '">' +
            '<div class="chat-bubble-meta">' + label + "</div>" +
            '<div class="chat-bubble-body">' + formatMessageBody(msg.text) + "</div>" +
          "</div>"
        );
      })
      .join("");

    if (busy) {
      showPending();
    } else {
      pendingBubble = null;
    }

    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  messagesRef.limitToLast(80).on("value", function(snapshot) {
    renderMessages(snapshot.val() || {});
  });

  database.ref(".info/connected").on("value", function(snapshot) {
    if (busy) {
      return;
    }
    if (snapshot.val()) {
      setStatus("synced · projector agent online", false);
    } else {
      setStatus("offline · reconnecting…", true);
    }
  });

  function saveMessage(text, sender) {
    return messagesRef.push({
      text: text,
      sender: sender,
      timestamp: Date.now()
    });
  }

  async function getChatGPTResponse(userMessage) {
    const history = recentContext.slice();
    if (history.length && history[history.length - 1].role === "user") {
      history.pop();
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(function() {
      controller.abort();
    }, 110000);

    let response;
    try {
      response = await fetch(AGENT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          history: history
        }),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeoutId);
    }

    let data = null;
    try {
      data = await response.json();
    } catch (e) {
      data = null;
    }

    if (!response.ok) {
      const detail =
        (data && data.error) ||
        ("HTTP " + response.status + " from chatAgent");
      throw new Error(detail);
    }

    const reply = data && data.reply;
    if (!reply) {
      throw new Error("Empty response from the agent function.");
    }
    return String(reply).trim();
  }

  async function handleSend(event) {
    event.preventDefault();
    if (busy) {
      return;
    }

    const text = (inputEl.value || "").trim();
    if (!text) {
      return;
    }

    busy = true;
    inputEl.value = "";
    inputEl.disabled = true;
    if (sendBtn) {
      sendBtn.disabled = true;
    }
    setStatus("composing visual reply…", false);
    showPending();

    try {
      await saveMessage(text, "user");
      const aiResponse = await getChatGPTResponse(text);
      await saveMessage(aiResponse, "bot");
      setStatus("synced · projector agent online", false);
    } catch (error) {
      console.error(error);
      let message = "request failed";
      if (error && error.name === "AbortError") {
        message = "Timed out waiting for the agent (cold start can take a minute). Try again.";
      } else if (error && error.message) {
        message = error.message;
      }
      setStatus("error · " + message, true);
      try {
        await saveMessage(
          "I hit a snag talking to the model: " + message +
            ". If this is the first deploy, make sure the Cloud Function is live.",
          "bot"
        );
      } catch (e) {
        // ignore secondary write errors
      }
    } finally {
      busy = false;
      removePending();
      inputEl.disabled = false;
      if (sendBtn) {
        sendBtn.disabled = false;
      }
      inputEl.focus();
    }
  }

  formEl.addEventListener("submit", handleSend);

  inputEl.addEventListener("keydown", function(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      formEl.requestSubmit();
    }
  });
});
