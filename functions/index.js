/**
 * Agents chatbot backend - keeps the OpenAI secret off GitHub Pages.
 *
 * Deploy:
 *   firebase.cmd functions:secrets:set OPENAI_API_KEY
 *   firebase.cmd deploy --only functions
 */

const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");

initializeApp();

// Secret is injected at runtime - never put sk- keys in client JS
const openAiKey = defineSecret("OPENAI_API_KEY");

// Personality / domain for the projector-art assistant
const SYSTEM_PROMPT =
  "You are Agents, a creative coding collaborator for projector art. " +
  "Help the user invent, debug, and refine visuals in p5.js and Three.js meant for large-scale projection - " +
  "installations, live visuals, dark rooms, high contrast, and immersive fields. " +
  "Prefer concrete code sketches, short explanations, and projector-aware tips (aspect ratios, brightness, " +
  "performance, seamless loops, full-bleed canvases). Keep replies focused and practical. " +
  "When useful, suggest color palettes, motion systems, grid/matrix ideas, shaders-lite approaches, " +
  "and ways to make the sketch feel like generative art rather than a UI demo.";

// Only these sites may call the function (CORS)
const ALLOWED_ORIGINS = [
  "https://naikynook.github.io",
  "http://localhost",
  "http://127.0.0.1"
];

// Return a matching allowlisted origin, or null to reject
function getAllowedOrigin(req) {
  const origin = req.get("origin") || "";
  // No Origin header (e.g. some tools) - treat as the live site
  if (!origin) {
    return "https://naikynook.github.io";
  }
  const ok = ALLOWED_ORIGINS.some(function(allowed) {
    return origin === allowed || origin.startsWith(allowed + ":");
  });
  return ok ? origin : null;
}

// Keep only the last 8 clean user/assistant turns
function sanitizeHistory(history) {
  if (!Array.isArray(history)) {
    return [];
  }
  return history
    .slice(-8)
    .map(function(item) {
      if (!item || typeof item.content !== "string") {
        return null;
      }
      const role = item.role === "assistant" ? "assistant" : "user";
      const content = item.content.trim().slice(0, 4000);
      if (!content) {
        return null;
      }
      return { role: role, content: content };
    })
    .filter(Boolean);
}

function setCors(res, origin) {
  res.set("Access-Control-Allow-Origin", origin);
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  res.set("Access-Control-Max-Age", "3600");
}

// Public HTTP endpoint used by chat-bot.js
exports.chatAgent = onRequest(
  {
    secrets: [openAiKey],
    region: "us-central1",
    invoker: "public",   // GitHub Pages has no Firebase Auth user
    timeoutSeconds: 120,
    memory: "256MiB",
    cors: false,         // We set CORS headers ourselves
    maxInstances: 10
  },
  async function(req, res) {
    const origin = getAllowedOrigin(req);
    if (!origin) {
      res.status(403).json({ error: "Origin not allowed." });
      return;
    }
    setCors(res, origin);

    // Browser preflight for cross-origin POST
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "POST only" });
      return;
    }

    try {
      const body = req.body || {};
      const message = typeof body.message === "string" ? body.message.trim() : "";
      if (!message) {
        res.status(400).json({ error: "Message is required." });
        return;
      }
      if (message.length > 2000) {
        res.status(400).json({ error: "Message is too long." });
        return;
      }

      const key = openAiKey.value();
      if (!key || !String(key).trim()) {
        res.status(500).json({
          error: "OPENAI_API_KEY secret is missing on the server."
        });
        return;
      }

      // system + history + current user message
      const history = sanitizeHistory(body.history);
      const messages = [{ role: "system", content: SYSTEM_PROMPT }]
        .concat(history)
        .concat([{ role: "user", content: message }]);

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + key
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.7,
          messages: messages
        })
      });

      if (!response.ok) {
        let detail = "OpenAI request failed (HTTP " + response.status + ")";
        try {
          const errBody = await response.json();
          if (errBody && errBody.error && errBody.error.message) {
            detail = errBody.error.message;
          }
        } catch (e) {
          // ignore parse errors; keep generic detail
        }
        res.status(502).json({ error: detail });
        return;
      }

      const data = await response.json();
      const content = data && data.choices && data.choices[0] && data.choices[0].message
        ? data.choices[0].message.content
        : null;

      if (!content || !String(content).trim()) {
        res.status(502).json({ error: "Empty response from the model." });
        return;
      }

      res.status(200).json({ reply: String(content).trim() });
    } catch (error) {
      console.error("chatAgent failed:", error);
      res.status(500).json({
        error: (error && error.message) ? String(error.message).slice(0, 300) : "Unexpected server error"
      });
    }
  }
);
