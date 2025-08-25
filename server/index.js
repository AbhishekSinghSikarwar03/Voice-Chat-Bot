import "dotenv/config";
import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import cors from "cors";
import { GoogleGenAI, Modality } from "@google/genai";

const PORT = process.env.PORT || 8080;
const MODEL = process.env.GEMINI_MODEL || "gemini-live-2.5-flash-preview"; // dev
// Final deploy pe: gemini-2.5-flash-preview-native-audio-dialogue
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.get("/health", (_, res) => res.json({ ok: true }));

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/realtime" });

wss.on("connection", async (ws) => {
  let session;
  let closed = false;

  // Queue for sending Gemini->client audio frames in order
  const sendToClient = (obj) =>
    ws.readyState === 1 && ws.send(JSON.stringify(obj));

  try {
    session = await ai.live.connect({
      model: MODEL,
      config: {
  responseModalities: [Modality.AUDIO],
  // Neutral, multi-brand, multilingual assistant
  systemInstruction:
    "You are a friendly motorcycle-buying assistant for India. " +
    "Auto-detect the user's spoken language and reply in the SAME language. " +
    "Supported: English (en), Hindi (hi), Marathi (mr), Gujarati (gu), Bengali (bn), Tamil (ta), Telugu (te). " +
    "Cover ALL brands and models (Hero, Honda, TVS, Yamaha, Bajaj, KTM, Royal Enfield, Suzuki, Aprilia, Jawa, Triumph, Harley-Davidson, Revolt, etc.). " +
    "Do NOT bias toward any single brand unless the user asks for it. " +
    "When the user asks about 'a bike' generically, briefly ask 1–2 clarifying questions (budget range, use case: city/long ride, fuel/EV preference) before recommending. " +
    "Provide short, conversational answers with key specs (engine/EV motor, power/torque, mileage/range, seat height, weight), pros/cons, and rough on-road price. " +
    "If an exact price/availability is uncertain, say it's approximate and suggest checking a local dealer. " +
    "Switch language immediately if the user switches; avoid mixing languages unless the user does.",
},

      callbacks: {
        onopen: () => sendToClient({ type: "session_open" }),
        onmessage: (msg) => {
          // Gemini messages can be: text, data (audio), serverContent, events, etc.
          if (msg?.data) {
            // Base64-encoded 24kHz 16-bit PCM frames
            sendToClient({ type: "audio", data: msg.data });
          } else if (msg?.text) {
            sendToClient({ type: "text", text: msg.text });
          } else if (msg?.serverContent?.interrupted) {
            // Model output was interrupted by user speech (VAD)
            sendToClient({ type: "interrupted" });
          } else if (msg?.serverContent?.turnComplete) {
            sendToClient({ type: "turn_complete" });
          }
        },
        onerror: (e) => sendToClient({ type: "error", error: e.message }),
        onclose: () => {
          if (!closed) ws.close();
        },
      },
    });
  } catch (e) {
    sendToClient({ type: "error", error: String(e) });
    ws.close();
    return;
  }

  ws.on("message", async (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      if (msg.type === "audio") {
        // msg.data: base64 16-kHz, 16-bit mono PCM
        await session.sendRealtimeInput({
          audio: { data: msg.data, mimeType: "audio/pcm;rate=16000" },
        });
      } else if (msg.type === "text") {
        // Optional text input support
        await session.sendClientContent({
          turns: [{ role: "user", parts: [{ text: msg.text }] }],
          turnComplete: true,
        });
      } else if (msg.type === "end_turn") {
        // Helpful if you chunk mic input — marks user turn complete
        await session.sendClientContent({ turns: [], turnComplete: true });
      } else if (msg.type === "interrupt") {
        // Client requested to stop current playback locally; Live API will auto-cancel
        // on new audio (VAD). Optionally, you can just drop the audio queue on the client side.
      }
    } catch (e) {
      sendToClient({ type: "error", error: String(e) });
    }
  });

  ws.on("close", () => {
    closed = true;
    try {
      session?.close();
    } catch {}
  });
});

// Keepalive
setInterval(() => {
  wss.clients.forEach((client) => {
    try {
      client.ping();
    } catch {}
  });
}, 15000);

server.listen(PORT, () => console.log("Server on http://localhost:" + PORT));
