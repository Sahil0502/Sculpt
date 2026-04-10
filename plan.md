# CareerSync - Complete Architecture & Build Plan

## Context
7-hour hackathon. Build a 1-on-1 performance catalyst web app (mobile/tablet compatible) with online video meetings (WebRTC), offline voice recording with speaker recognition via voice embeddings, real-time transcription, pitch analysis, RAG-based AI insights using GPT-5-mini, and role-based dashboards for managers and employees.

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | **Next.js 14 (App Router)** | SSR, API routes, mobile-responsive |
| UI | **Tailwind CSS + shadcn/ui** | Rapid, responsive, mobile-first |
| Database | **Supabase (PostgreSQL + pgvector)** | Auth, realtime, vector search, free tier |
| AI | **OpenAI GPT-5-mini** | User's choice for all AI tasks |
| Video/Audio | **PeerJS (WebRTC wrapper)** | Simplifies WebRTC, free signaling server |
| Transcription | **Web Speech API** | Free, real-time, browser-built-in |
| Pitch Analysis | **Web Audio API + Meyda.js** | Real-time frequency/pitch extraction |
| Voice Embeddings | **Meyda.js (MFCC extraction)** | Browser-based voice fingerprinting |
| RAG Embeddings | **OpenAI text-embedding-3-small** | Cheap, fast, pairs with GPT-5-mini |
| Charts | **Recharts** | Radar charts, line charts for growth |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js App (Mobile Responsive)              │
├────────┬──────────┬───────────┬────────────┬───────────────────┤
│ Auth   │ Schedule │ Meeting   │ Insights   │ Dashboard         │
│ Login  │ Calendar │ (Online/  │ & Action   │ (Manager/         │
│ Onboard│ Approve  │  Offline) │ Items      │  Employee)        │
├────────┴──────────┴───────────┴────────────┴───────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │ PeerJS       │  │ Web Speech   │  │ Web Audio API         │ │
│  │ (WebRTC)     │  │ API          │  │ + Meyda.js            │ │
│  │ Video/Audio  │  │ Transcription│  │ Pitch + Voice Embed   │ │
│  └──────┬───────┘  └──────┬───────┘  └───────────┬───────────┘ │
│         │                  │                      │             │
├─────────┴──────────────────┴──────────────────────┴─────────────┤
│                      API Routes (/api/*)                         │
│                                                                  │
│  /api/meeting/process    → Transcript + Pitch → GPT-5-mini      │
│  /api/rag/embed          → Chunk + Embed user context            │
│  /api/rag/query          → Vector search + GPT-5-mini            │
│  /api/agenda/generate    → RAG context + GPT → Agenda            │
│  /api/schedule           → Meeting scheduling + approval         │
│  /api/onboarding/voice   → Store voice embeddings                │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                    Supabase                                       │
│  ┌──────────┬───────────┬──────────────┬──────────────────────┐  │
│  │ Auth     │ PostgreSQL│ pgvector     │ Realtime             │  │
│  │ (Roles)  │ (Tables)  │ (Embeddings) │ (WebRTC Signaling)  │  │
│  └──────────┴───────────┴──────────────┴──────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Database Schema (Supabase + pgvector)

```sql
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Users with role-based access
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('manager', 'employee')),
  designation TEXT,                    -- e.g. 'Senior PM'
  function TEXT,                       -- e.g. 'ProductManagement'
  seniority_level INT,                 -- index into competencies.json roles
  manager_id UUID REFERENCES users(id), -- who is this employee's manager
  voice_embedding VECTOR(13),          -- MFCC voice fingerprint (13 coefficients)
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Meeting scheduling with approval flow
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID REFERENCES users(id) NOT NULL,
  employee_id UUID REFERENCES users(id) NOT NULL,
  requested_by UUID REFERENCES users(id) NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT DEFAULT 30,
  mode TEXT NOT NULL CHECK (mode IN ('online', 'offline')),
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',      -- waiting for other party to approve
    'approved',     -- both parties agreed
    'in_progress',  -- meeting happening now
    'completed',    -- meeting done
    'cancelled'
  )),
  -- Meeting data (populated during/after meeting)
  transcript JSONB,              -- [{speaker, text, timestamp, pitch_data}]
  summary TEXT,                  -- AI-generated incremental summary
  agenda JSONB,                  -- AI-generated agenda items
  health_score JSONB,            -- {coverage, actionability, followThrough, overall}
  blind_spots JSONB,             -- unaddressed competencies
  sentiment JSONB,               -- {manager: {overall, timeline}, employee: {overall, timeline}}
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Availability slots for scheduling
CREATE TABLE availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  day_of_week INT CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_recurring BOOLEAN DEFAULT true
);

-- Action Items
CREATE TABLE action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES meetings(id),
  assignee_id UUID REFERENCES users(id),
  description TEXT NOT NULL,
  competency_dimension TEXT,      -- mapped to VED framework
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Competency Scores (per meeting)
CREATE TABLE competency_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES meetings(id),
  user_id UUID REFERENCES users(id),
  dimension TEXT NOT NULL,         -- e.g. 'ProductDiscovery'
  score INT CHECK (score BETWEEN 1 AND 5),
  evidence TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Feedback entries
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES meetings(id),
  from_user_id UUID REFERENCES users(id),
  to_user_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  competency_dimension TEXT,
  sentiment TEXT CHECK (sentiment IN ('positive', 'constructive', 'neutral')),
  is_actionable BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RAG Document Chunks (the core of RAG pipeline)
CREATE TABLE rag_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  source_type TEXT NOT NULL,       -- 'meeting_summary', 'action_item', 'feedback', 'competency'
  source_id UUID,                  -- reference to source record
  content TEXT NOT NULL,           -- the chunk text
  embedding VECTOR(1536),          -- OpenAI text-embedding-3-small dimension
  metadata JSONB,                  -- {meeting_date, competency, etc.}
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for vector similarity search
CREATE INDEX ON rag_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- RLS policies for role-based access
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
-- Managers see their reportees' data, employees see only their own
```

---

## Feature Breakdown

### 1. Auth & Onboarding (Supabase Auth)

**Login:** Email/password with role selection (manager/employee)

**Onboarding flow:**
1. Sign up → select role → fill profile (name, designation, function, seniority)
2. **Voice enrollment**: Record 10-second voice sample
   - Web Audio API captures audio stream
   - Meyda.js extracts 13 MFCC coefficients per frame
   - Average across all frames → single 13-dim vector = voice embedding
   - Store in `users.voice_embedding` (pgvector)
3. If employee → select manager from dropdown
4. Manager sets availability slots

### 2. Meeting Scheduling + Approval

**Flow:**
```
Manager/Employee requests meeting
         │
         ▼
  Check availability table
  Show overlapping free slots
         │
         ▼
  Other party gets notification
  (Supabase Realtime subscription)
         │
         ▼
  Approve / Suggest alternative
         │
         ▼
  Status → 'approved'
  Both see it on dashboard
```

**UI:** Calendar view (mobile-friendly) showing:
- Available slots (green)
- Pending requests (yellow)
- Confirmed meetings (blue)

### 3. Online Meeting Mode (WebRTC + PeerJS)

**Architecture:**
```
┌─────────────┐    PeerJS Cloud     ┌─────────────┐
│  Manager    │◄──(Signaling)──────►│  Employee   │
│  Browser    │                      │  Browser    │
│             │◄──(P2P Media)──────►│             │
│  ┌────────┐ │                      │ ┌────────┐ │
│  │Video   │ │                      │ │Video   │ │
│  │Audio   │ │                      │ │Audio   │ │
│  │Speech  │ │                      │ │Speech  │ │
│  │API     │ │                      │ │API     │ │
│  │Pitch   │ │                      │ │Pitch   │ │
│  │Analyzer│ │                      │ │Analyzer│ │
│  └────────┘ │                      │ └────────┘ │
└─────────────┘                      └─────────────┘
```

- **Video/Audio**: PeerJS handles WebRTC connection
- **Transcription**: Each participant's browser runs Web Speech API on their own mic → speaker is known automatically (no diarization needed!)
- **Pitch Analysis**: Each browser runs Web Audio API on local mic stream
- **Transcript sync**: Both sides send their labeled transcript chunks via PeerJS data channel → merged into unified transcript
- **Speaker identification is trivial**: Each person's browser knows who they are (they're logged in)

### 4. Offline Meeting Mode (Mobile Recording)

**Flow:**
```
Employee opens app on phone
         │
         ▼
  Starts recording (MediaRecorder API)
  Web Audio API analyzes pitch in real-time
         │
         ▼
  Audio segments processed:
  1. Extract MFCC features per segment (Meyda.js)
  2. Compare with stored voice embeddings (cosine similarity)
  3. Label: manager vs employee
         │
         ▼
  After recording stops:
  - Web Speech API processes audio for transcript
  - Each segment gets speaker label from voice matching
  - Pitch data attached per segment
         │
         ▼
  Upload structured transcript to server
```

**Voice Recognition Algorithm:**
```
For each audio segment (~2-3 seconds):
  1. Extract 13 MFCC coefficients via Meyda.js
  2. Average across frames → segment_embedding (13-dim vector)
  3. Compute cosine_similarity(segment_embedding, manager_voice_embedding)
  4. Compute cosine_similarity(segment_embedding, employee_voice_embedding)
  5. Assign speaker = argmax(similarities)
  6. Confidence threshold: if max_similarity < 0.6, label as "unknown"
```

### 5. Pitch Analysis (Web Audio API)

**Real-time extraction using Web Audio API AnalyserNode + Meyda.js:**

```javascript
// Schema for pitch data (what pitch.json represents)
{
  "segment_id": "uuid",
  "speaker": "manager" | "employee",
  "timestamp_start": 1234567890,
  "timestamp_end": 1234567893,
  "pitch": {
    "fundamental_frequency_hz": 185.5,   // F0 - voice pitch
    "pitch_range": { "min": 120, "max": 280 },
    "variability": 0.73,                  // 0-1, monotone vs expressive
  },
  "energy": {
    "average_db": -22.5,                  // volume level
    "peak_db": -15.2,
    "variability": 0.45
  },
  "speaking_rate": {
    "words_per_minute": 142,
    "pause_frequency": 3.2               // pauses per minute
  },
  "spectral": {
    "mfcc": [13 coefficients],           // voice timbre
    "spectral_centroid": 2450.5,         // brightness of voice
    "spectral_rolloff": 4200.0
  },
  "emotion_indicators": {
    "stress_index": 0.35,                // derived from pitch + energy
    "engagement_index": 0.78,            // derived from variability + rate
    "confidence_index": 0.82             // derived from pitch stability + volume
  }
}
```

### 6. RAG Pipeline Architecture

```
┌──────────────────────────────────────────────────────┐
│                RAG Pipeline                           │
│                                                       │
│  INDEXING (after each meeting):                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │ 1. Collect user context:                        │ │
│  │    - User profile (role, designation, goals)    │ │
│  │    - Meeting summary + transcript highlights    │ │
│  │    - Action items + completion status           │ │
│  │    - Competency scores + feedback               │ │
│  │    - Pitch analysis summary                     │ │
│  │                                                 │ │
│  │ 2. Generate markdown document per user:         │ │
│  │    "## Meeting 2026-04-10                       │ │
│  │     Summary: Discussed product discovery...     │ │
│  │     Action Items: [completed] Ship PRD...       │ │
│  │     Competency: ProductDiscovery 4/5..."        │ │
│  │                                                 │ │
│  │ 3. Chunk into ~500 token segments               │ │
│  │    (overlap 50 tokens for context continuity)   │ │
│  │                                                 │ │
│  │ 4. Embed each chunk:                            │ │
│  │    OpenAI text-embedding-3-small → 1536-dim     │ │
│  │                                                 │ │
│  │ 5. Store in rag_chunks table (pgvector)         │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
│  RETRIEVAL (before generating insights/agenda):       │
│  ┌─────────────────────────────────────────────────┐ │
│  │ 1. Extract keywords from prompt/context         │ │
│  │ 2. Embed the query                              │ │
│  │ 3. pgvector: SELECT top 5 chunks                │ │
│  │    ORDER BY embedding <=> query_embedding       │ │
│  │ 4. Inject as "User History" in GPT prompt       │ │
│  └─────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

### 7. GPT-5-mini Prompt Schema (JSON Mode)

```json
{
  "system": "You are a 1-on-1 meeting analyst for the CareerSync platform. Analyze the meeting transcript and pitch data against the employee's competency framework. Always respond in the exact JSON schema provided.",
  "user_context": {
    "employee_profile": "... from RAG top 5 chunks ...",
    "competency_framework": "... relevant slice from competencies.json ...",
    "previous_action_items": ["..."],
    "meeting_transcript": [{"speaker": "...", "text": "...", "pitch": {...}}],
    "pitch_summary": {
      "manager": {"avg_pitch": 180, "stress_index": 0.3, "engagement": 0.8},
      "employee": {"avg_pitch": 165, "stress_index": 0.5, "engagement": 0.6}
    }
  },
  "response_schema": {
    "summary": "string - 2-3 sentence meeting summary",
    "sentiment": {
      "manager": {"overall": "positive|neutral|negative", "confidence": 0.85},
      "employee": {"overall": "string", "confidence": 0.0}
    },
    "key_decisions": ["string"],
    "action_items": [
      {
        "description": "string",
        "assignee": "manager|employee",
        "competency_dimension": "string",
        "due_date": "YYYY-MM-DD",
        "priority": "high|medium|low"
      }
    ],
    "feedback": [
      {
        "from": "manager|employee",
        "to": "manager|employee",
        "content": "string - specific, actionable feedback",
        "competency_dimension": "string",
        "sentiment": "positive|constructive|neutral"
      }
    ],
    "competency_scores": [
      {
        "dimension": "string",
        "score": 1-5,
        "evidence": "string - specific quote or behavior from transcript"
      }
    ],
    "blind_spots": ["string - competencies not discussed"],
    "engagement_analysis": {
      "manager_engagement": "high|medium|low",
      "employee_engagement": "high|medium|low",
      "conversation_balance": 0.55,
      "notable_moments": ["string"]
    },
    "growth_insights": "string - how the employee is progressing",
    "next_meeting_suggestions": ["string"]
  }
}
```

---

## Pages & UI (Mobile-First)

### `/login` - Auth Page
- Email/password login
- Role indicator (manager/employee)
- Redirect to role-specific dashboard

### `/onboarding` - First-time Setup
- Profile form (name, designation, function, seniority)
- Voice enrollment: "Read this paragraph aloud for 10 seconds"
- Waveform visualization during recording
- Manager selection (for employees)
- Availability setup

### `/dashboard` - Role-Based Dashboard

**Manager View:**
- Team members list with next meeting dates
- Pending meeting approvals
- Action items awaiting follow-up
- Team growth radar (aggregate)

**Employee View:**
- Next meeting countdown
- My action items (pending/completed)
- Growth radar chart (personal)
- Request meeting button

### `/schedule` - Meeting Scheduler
- Calendar showing both parties' availability (overlap highlighted)
- Mode selector: Online / Offline
- Request → approval flow
- Mobile: swipeable week view

### `/meeting/[id]` - Meeting Room

**Online Mode (Desktop/Tablet):**
```
┌──────────────────────────────────┬─────────────────────┐
│  ┌──────────┐  ┌──────────┐     │  📋 AGENDA          │
│  │ Manager  │  │ Employee │     │  (AI-generated)     │
│  │  Video   │  │  Video   │     │  ☐ Review action    │
│  └──────────┘  └──────────┘     │    items from last  │
│                                  │  ☐ Discuss product  │
│  📝 Live Transcript              │    discovery gaps   │
│  ──────────────────              │  ☐ Career growth    │
│  Priya: How did the sprint go?  │                     │
│  Arjun: We shipped the PRD...   │  📌 CARRY-OVER      │
│                                  │  ⚠ Ship PRD (late)  │
│  🎵 Pitch Indicators            │  ✅ User research   │
│  [Engagement: ████░ 78%]        │                     │
│  [Stress:     ██░░░ 35%]        │  🔔 BLIND SPOTS     │
│                                  │  "GTM not discussed │
│  [🎙 Mute] [📹 Cam] [⏹ End]   │   in 2 meetings"   │
└──────────────────────────────────┴─────────────────────┘
```

**Online Mode (Mobile):**
- Video takes top 40% of screen
- Bottom 60% is swipeable tabs: Transcript | Agenda | Pitch
- Floating action buttons for mute/camera/end

**Offline Mode (Mobile):**
```
┌─────────────────────────┐
│  🎙 Recording            │
│  ●  00:15:32             │
│                          │
│  Live Waveform ~~~~~~~~  │
│                          │
│  Priya: I think we...   │
│  Arjun: Yes, and the... │
│  (speaker auto-detected) │
│                          │
│  [⏸ Pause] [⏹ Stop]     │
│                          │
│  Agenda (collapsible)    │
│  ▸ Review action items   │
│  ▸ Discuss discovery     │
└─────────────────────────┘
```

### `/insights/[meetingId]` - Post-Meeting Insights
- Meeting summary (AI-generated)
- Sentiment analysis with pitch visualization
- Action items (editable, assignable)
- Competency scores with evidence quotes
- Meeting health score gauge
- Blind spot radar chart
- Engagement analysis (who talked more, stress levels)

### `/growth` - Employee Growth View (Reportee)
- Spider/radar chart: competency scores over time
- Action items timeline
- Meeting history with summaries
- "Where I stand" against framework expectations
- Trend arrows (improving / declining / stable per dimension)

---

## File Structure

```
/app
  /layout.tsx                         -- Root layout, mobile-responsive
  /page.tsx                           -- Redirect based on auth
  /login/page.tsx                     -- Auth page
  /onboarding/page.tsx                -- Voice enrollment + profile
  /dashboard/page.tsx                 -- Role-based dashboard
  /schedule/page.tsx                  -- Meeting scheduler
  /meeting/[id]/page.tsx              -- Meeting room (online/offline)
  /insights/[id]/page.tsx             -- Post-meeting insights
  /growth/page.tsx                    -- Employee growth view
  /api/
    /auth/route.ts                    -- Auth helpers
    /meetings/route.ts                -- CRUD meetings
    /meetings/[id]/approve/route.ts   -- Approve meeting
    /meetings/[id]/process/route.ts   -- Process transcript → GPT
    /agenda/generate/route.ts         -- RAG + GPT → agenda
    /rag/embed/route.ts               -- Chunk + embed + store
    /rag/query/route.ts               -- Vector search + retrieve
    /voice/enroll/route.ts            -- Store voice embedding
    /seed/route.ts                    -- Seed demo data

/components/
  /meeting/
    VideoCall.tsx                     -- PeerJS WebRTC component
    TranscriptPanel.tsx               -- Web Speech API live transcript
    AgendaPanel.tsx                   -- Right panel agenda
    PitchAnalyzer.tsx                 -- Web Audio API pitch bars
    OfflineRecorder.tsx               -- Mobile recording + voice ID
    MeetingControls.tsx               -- Mute/camera/end buttons
  /insights/
    SentimentChart.tsx                -- Pitch + sentiment timeline
    HealthScore.tsx                   -- Gauge component
    BlindSpotRadar.tsx                -- Radar chart
    ActionItemsList.tsx               -- Editable action items
    CompetencyScores.tsx              -- Scores with evidence
  /dashboard/
    GrowthRadar.tsx                   -- Spider chart (Recharts)
    MeetingCard.tsx                   -- Meeting summary card
    TeamOverview.tsx                  -- Manager's team grid
    ActionTracker.tsx                 -- Action items progress
  /schedule/
    Calendar.tsx                      -- Availability calendar
    TimeSlotPicker.tsx                -- Slot selection
    ApprovalCard.tsx                  -- Approve/reject meeting
  /onboarding/
    VoiceEnrollment.tsx              -- Record + visualize + save
    ProfileForm.tsx                   -- User details
  /ui/                               -- shadcn components

/lib/
  supabase.ts                        -- Supabase client + types
  openai.ts                          -- GPT-5-mini + embeddings client
  speech.ts                          -- Web Speech API wrapper
  pitch.ts                           -- Web Audio API + Meyda.js pitch extraction
  voice-id.ts                        -- Voice embedding comparison (cosine sim)
  rag.ts                             -- RAG pipeline: chunk, embed, retrieve
  competencies.ts                    -- Load + filter competency framework
  types.ts                           -- TypeScript interfaces
  prompts.ts                         -- GPT prompt templates (JSON schema)

/seed/
  personas.ts                        -- Manager + employee profiles
  meetings.ts                        -- 3 past meeting transcripts
  data.ts                            -- Seed script
```

---

## Unique Standout Feature: "Blind Spot Radar" + Pitch Sentiment

The combination of **voice pitch analysis** + **competency blind spot detection** is the differentiator:

1. **Pitch-Sentiment Fusion**: Not just what was said (transcript) but HOW it was said (pitch). Detects stress when discussing certain competencies, low engagement on topics, confidence levels.

2. **Blind Spot Radar**: AI analyzes across meetings what competencies are never discussed → proactive nudges. This is the **agentic behavior** the judges want.

3. **Meeting Health Score**: Auto-rates each 1-on-1 on coverage (% competencies touched), actionability (specific vs vague), follow-through (% past items addressed), engagement balance (who dominated).

---

## 7-Hour Build Timeline

| Hour | Task | Details |
|------|------|---------|
| 0:00-0:30 | Setup | Next.js, Supabase project, shadcn, env vars, pgvector extension |
| 0:30-1:00 | Auth + DB | Schema migration, Supabase auth, role-based RLS, seed data |
| 1:00-1:30 | Onboarding | Profile form + voice enrollment (Meyda.js MFCC extraction) |
| 1:30-2:30 | Meeting page (online) | PeerJS video call + Web Speech API transcript + split layout |
| 2:30-3:00 | Pitch analyzer | Web Audio API integration, real-time pitch bars in meeting UI |
| 3:00-3:30 | Offline mode | Mobile recorder + voice embedding matching for speaker ID |
| 3:30-4:00 | Agenda generation | RAG query + GPT-5-mini → structured agenda (JSON mode) |
| 4:00-4:45 | Meeting processing | Transcript + pitch → GPT-5-mini → insights, action items, scores |
| 4:45-5:15 | RAG pipeline | Chunk meeting data → embed → store in pgvector |
| 5:15-6:00 | Insights page | Sentiment charts, health score, blind spots, action items |
| 6:00-6:30 | Dashboard + Growth | Role-based dashboards, growth radar, scheduling UI |
| 6:30-7:00 | Demo prep | Seed 3 past meetings, verify continuity, polish responsive UI |

---

## Demo Flow (for judges)

1. **Login as Manager (Priya)** → Dashboard shows team, pending items
2. **Schedule meeting** → Show availability overlap, employee approves
3. **Start online meeting** → Video call, live transcript, agenda on right, pitch bars
4. **End meeting** → AI processes → show insights page with sentiment, action items, scores
5. **Login as Employee (Arjun)** → Growth radar, action items, "where I stand"
6. **Show meeting 2** → Agenda auto-references meeting 1 action items (continuity!)
7. **Show blind spot** → "GTMGrowth not discussed in 3 meetings" nudge
8. **Show offline mode on mobile** → Record, voice recognition labels speakers correctly
9. **Show pitch insight** → "Employee showed high stress when discussing deadlines"

---

## Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| WebRTC lib | PeerJS | Wraps WebRTC complexity, free cloud signaling, <50 lines to set up |
| Speaker ID (online) | Browser-native | Each browser knows its logged-in user, no ML needed |
| Speaker ID (offline) | MFCC cosine similarity | Simple, runs in browser, good enough for 2-speaker scenario |
| Transcription | Web Speech API | Free, real-time, no API key. Chrome-only fine for demo |
| RAG storage | pgvector in Supabase | One DB for everything, no extra infra |
| Embeddings | text-embedding-3-small | 1536-dim, cheap, pairs with GPT-5-mini |
| Token optimization | Incremental summary + RAG top-5 | Never dump full history, only relevant chunks |


