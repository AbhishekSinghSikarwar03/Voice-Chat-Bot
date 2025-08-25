# 🤖 Voice Chat Bot — Robot UI + Gemini Live

A robot-style voice assistant built with **Node.js + WebSockets** on the backend and a simple **HTML/CSS/JS UI** on the frontend.  
The bot can **listen, talk, and auto-detect your language** (English, Hindi, Marathi, Gujarati, Bengali, Tamil, Telugu).  
It’s a fun experiment to explore **real-time AI conversations** with a clean futuristic design.

---

## ✨ Features
- 🎙 Real-time mic input → AI voice reply
- 🌐 Multilingual support (auto-detect + same language response)
- 🤖 Robot avatar with glowing eyes + speaking pulse rings
- 🛑 Barge-in: interrupt while it’s speaking
- ⚡ Built using Node.js (server) + vanilla HTML/CSS/JS (client)
- 🏍 Provides multi-brand bike information (not just Revolt)

---


## 📂 Project Structure

voice-chat-bot/
│
├── public/                 # Frontend files
│   ├── index.html           # Main UI (robot face + controls)
│   └── styles.css           # Styling (glassmorphism, animations)
│
├── server/                  # Backend server
│   └── index.js             # Express + WebSocket bridge to Gemini Live
│
├── .gitignore               # Ignored files (.env, node_modules, etc.)
├── package.json             # Project metadata & dependencies
├── package-lock.json        # Dependency lock file
├── README.md                # Documentation
└── .env                     # Local secrets (ignored in Git)

  Setup

1. Clone this repo:
   git clone https://github.com/<your-username>/Voice-Chat-Bot.git
   cd Voice-Chat-Bot

2. Install dependencies:
   npm install
   
3. Create a .env file in the root:
   GOOGLE_API_KEY=your_google_api_key
   GEMINI_MODEL=gemini-2.5-flash-preview-native-audio-dialog
   PORT=

4. Start the server:
    npm start

5. Open in browser:
   http://localhost:8080      
