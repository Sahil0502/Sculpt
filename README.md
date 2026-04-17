🚀 Sculpt — AI-Powered 1:1 Performance Catalyst

Transforming 1-on-1 meetings into actionable growth insights using AI, voice intelligence, and real-time analytics.

🌐 Live Demo: https://buildverse-sculpt-two.vercel.app/login

🧠 Overview

Sculpt is a next-gen performance intelligence platform built during a hackathon to enhance manager ↔ employee 1-on-1 meetings.

It combines:

🎥 Real-time video meetings (WebRTC)
🎙 Voice intelligence (pitch + speaker recognition)
📝 Live transcription
🤖 AI-driven insights (RAG + GPT)
📊 Growth analytics dashboards

👉 The goal: Turn conversations into measurable growth.

✨ Key Features
🎥 Smart Meetings (Online + Offline)
WebRTC-based video calls using PeerJS
Offline recording mode (mobile-friendly)
Auto speaker identification (voice embeddings)
📝 Real-Time Transcription
Browser-native Web Speech API
Speaker-aware transcripts (no diarization needed online)
🎙 Voice Intelligence (Unique Feature)
Pitch, stress, engagement & confidence detection
MFCC-based voice fingerprinting (Meyda.js)
Speaker recognition for offline recordings
🤖 AI Insights Engine (GPT + RAG)
Meeting summaries
Action items with priority & deadlines
Feedback with competency mapping
Blind spot detection (what you didn’t discuss)
Growth insights over time
📊 Performance Analytics
Competency radar charts
Meeting health score
Engagement balance analysis
Action item tracking
📅 Smart Scheduling
Availability-based scheduling
Approval workflow
Manager ↔ employee sync
🧩 Tech Stack
Layer	Tech
Frontend	Next.js 14 (App Router), Tailwind CSS, shadcn/ui
Backend	Next.js API Routes
Database	Supabase (PostgreSQL + pgvector)
AI	OpenAI GPT-5-mini + text-embedding-3-small
Video	WebRTC (PeerJS)
Transcription	Web Speech API
Audio Analysis	Web Audio API + Meyda.js
Charts	Recharts
🏗 Architecture
Client (Next.js)
 ├── Video/Audio (WebRTC - PeerJS)
 ├── Transcription (Web Speech API)
 ├── Pitch Analysis (Web Audio API + Meyda)
 └── UI (Tailwind + shadcn)

API Routes (/api)
 ├── Meeting Processing (Transcript → GPT)
 ├── RAG Pipeline (Embed + Retrieve)
 ├── Agenda Generation
 └── Voice Embedding Storage

Database (Supabase)
 ├── Auth (Role-based)
 ├── PostgreSQL Tables
 ├── pgvector (Embeddings)
 └── Realtime (events)
🧬 Core Innovation
🔥 Blind Spot Radar + Pitch Intelligence

Sculpt doesn’t just analyze what was said, but also how it was said.

Detects stress, confidence, engagement
Identifies ignored competencies
Tracks conversation balance
Generates Meeting Health Score

👉 This creates a true performance feedback loop, not just notes.

📱 Screens & Flow
👤 Login & Onboarding
Role-based auth (Manager / Employee)
Voice enrollment (10-sec sample)
📊 Dashboard
Manager: team overview, approvals, insights
Employee: growth radar, tasks, meeting history
📅 Scheduler
Availability overlap detection
Approval workflow
🎥 Meeting Room
Live video + transcript
Real-time pitch analysis
AI-generated agenda
📈 Insights Page
Summary + sentiment
Action items
Competency scores
Blind spots
🧠 AI Pipeline (RAG)
Store meeting data → chunk → embed
Retrieve relevant history (top-K)
Inject into GPT prompt
Generate:
Summary
Feedback
Action items
Growth insights
⚙️ Setup Instructions
# Clone repo
git clone https://github.com/your-username/sculpt.git

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Run dev server
npm run dev
🔑 Environment Variables
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPENAI_API_KEY=
🚀 Deployment
Hosted on Vercel
Uses Supabase Cloud
Fully serverless architecture
🏆 Hackathon Highlights
Built in ~7 hours
Fully working:
Video meetings
AI insights
Voice intelligence
RAG pipeline
📊 Future Improvements
Multi-user meetings
Better speaker diarization (ML-based)
Emotion detection via voice + text fusion
Mobile app (React Native)
Slack / Teams integration
👨‍💻 Author

Sahil Singh
🔗 GitHub: https://github.com/Sahil0502

🔗 LinkedIn: https://www.linkedin.com/in/sahil-singh-ss9824/

⭐ If you like this project

Give it a ⭐ on GitHub — it helps!

💡 Note

This project was built for a hackathon, so some features are optimized for speed and demo value rather than production scale.
