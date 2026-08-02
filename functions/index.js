/**
 * Agents chatbot backend — keeps the OpenAI secret off GitHub Pages.
 *
 *   firebase functions:secrets:set OPENAI_API_KEY
 *   firebase deploy --only functions
 */

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");

initializeApp();

const openAiKey = defineSecret("OPENAI_API_KEY");

const SYSTEM_PROMPT =
  "You are Agents, a creative coding collaborator for projector art. " +
  "Help the user invent, debug, and refine visuals in p5.js and Three.js meant for large-scale projection — " +
  "installations, live visuals, dark rooms, high contrast, and immersive fields. " +
  "Prefer concrete code sketches, short explanations, and projector-aware tips (aspect ratios, brightness, " +
  "performance, seamless loops, full-bleed canvases). Keep replies focused and practical. " +
  "When useful, suggest color palettes, motion systems, grid/matrix ideas, shaders-lite approaches, " +
  "and ways to make the sketch feel like generative art rather than a UI demo.";

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

async function enforceRateLimit(clientKey) {
  const ref = getDatabase().ref("chat/rateLimits/" + clientKey);
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;
  const maxCalls = 30;

  const result = await ref.transaction(function(current) {
    const state = current || { count: 0, windowStart: now };
    if (now - (state.windowStart || 0) > windowMs) {
      return { count: 1, windowStart: now };
    }
    if ((state.count || 0) >= maxCalls) {
      return; // abort
    }
    return {
      count: (state.count || 0) + 1,
      windowStart: state.windowStart || now
    };
  });

  if (!result.committed) {
    throw new HttpsError(
      "resource-exhausted",
      "Too many chat requests from this client. Try again later."
    );
  }
}

exports.getChatGPTResponse = onCall(
  {
    secrets: [openAiKey],
    region: "us-central1",
    invoker: "public",
    cors: [
      "https://naikynook.github.io",
      /https:\/\/naikynook\.github\.io$/,
      /http:\/\/localhost(:\d+)?$/,
      /http:\/\/127\.0\.0\.1(:\d+)?$/
    ],
    maxInstances: 10
  },
  async function(request) {
    try {
      const message = request.data && typeof request.data.message === "string"
        ? request.data.message.trim()
        : "";
      if (!message) {
        throw new HttpsError("invalid-argument", "Message is required.");
      }
      if (message.length > 2000) {
        throw new HttpsError("invalid-argument", "Message is too long.");
      }

      const key = openAiKey.value();
      if (!key || !String(key).trim()) {
        throw new HttpsError(
          "failed-precondition",
          "OPENAI_API_KEY secret is missing. Run: firebase functions:secrets:set OPENAI_API_KEY"
        );
      }

      // Rate limit is best-effort — don't fail the whole chat if RTDB rate path errors
      try {
        const ip = (request.rawRequest && (request.rawRequest.ip || request.rawRequest.headers["x-forwarded-for"])) || "unknown";
        const clientKey = String(ip).split(",")[0].trim().replace(/[.#$/\[\]]/g, "_").slice(0, 80) || "unknown";
        await enforceRateLimit(clientKey);
      } catch (rateError) {
        if (rateError instanceof HttpsError) {
          throw rateError;
        }
        console.warn("Rate limit skipped:", rateError && rateError.message);
      }

      const history = sanitizeHistory(request.data && request.data.history);
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
          // ignore
        }
        // Do NOT use "internal" — Firebase hides those messages from the browser
        throw new HttpsError("failed-precondition", detail);
      }

      const data = await response.json();
      const content = data && data.choices && data.choices[0] && data.choices[0].message
        ? data.choices[0].message.content
        : null;

      if (!content || !String(content).trim()) {
        throw new HttpsError("failed-precondition", "Empty response from the model.");
      }

      return { reply: String(content).trim() };
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }
      console.error("getChatGPTResponse failed:", error);
      throw new HttpsError(
        "failed-precondition",
        (error && error.message) ? String(error.message).slice(0, 300) : "Unexpected server error"
      );
    }
  }
);
