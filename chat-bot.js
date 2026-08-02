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
  const callAgent = firebase.app().functions("us-central1").httpsCallable("getChatGPTResponse");

  let busy = false;
  let recentContext = [];

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

    if (!list.length) {
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
    // History excludes the message we just saved (last user turn), so drop trailing user dup
    const history = recentContext.slice();
    if (history.length && history[history.length - 1].role === "user") {
      history.pop();
    }

    const result = await callAgent({
      message: userMessage,
      history: history
    });

    const reply = result && result.data && result.data.reply;
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

    try {
      await saveMessage(text, "user");
      const aiResponse = await getChatGPTResponse(text);
      await saveMessage(aiResponse, "bot");
      setStatus("synced · projector agent online", false);
    } catch (error) {
      console.error(error);
      let message = "request failed";
      if (error) {
        if (error.code === "functions/not-found") {
          message = "Cloud Function not deployed yet. Run: firebase deploy --only functions";
        } else if (error.code === "functions/permission-denied" || /permission/i.test(String(error.message || ""))) {
          message = "Permission denied — redeploy the function with public invoker, and publish chat rules in Firebase.";
        } else if (error.code === "PERMISSION_DENIED" || error.code === "permission-denied") {
          message = "Database permission denied — publish firebase-database-rules.json in Realtime Database → Rules.";
        } else {
          message = error.message || (error.details && String(error.details)) || message;
        }
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
