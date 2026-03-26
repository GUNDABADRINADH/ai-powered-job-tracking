# AI-Powered Job Tracker 🚀

A modern, enterprise-grade job tracking application featuring **LangChain** and **LangGraph** orchestration for autonomous job matching and assistant workflows.

## 🏗️ Architecture Diagram

```mermaid
graph TD
    subgraph Frontend [React Frontend]
        UI[User Interface]
        JS[Job Store / State]
        CB[Chat Bubble Assistant]
    end

    subgraph Backend [Fastify Backend]
        API[REST API Layer]
        MS[Matching Service]
        AS[Assistant Service]
        DB[(JSON File Store)]
    end

    subgraph AI_Orchestration [AI Engine]
        LC[LangChain - LCEL]
        LG[LangGraph - StateGraph]
        GEMINI[Google Gemini 1.5 Flash]
    end

    subgraph External [External Services]
        ADZUNA[Adzuna Job API]
    end

    %% Data Flow
    UI <--> API
    CB <--> AS
    API --> MS
    MS --> LC
    AS --> LG
    LC --> GEMINI
    LG --> GEMINI
    API <--> ADZUNA
    API <--> DB

    ### 🔄 Data Flow Explanation

1. User interacts with UI or AI assistant
2. Request goes to Fastify backend
3. For job search:
   - Backend calls Adzuna API (real-time jobs)
   - Jobs passed to LangChain for AI matching
4. For assistant:
   - LangGraph processes intent and routes actions
   - Returns structured response for UI updates
5. Frontend updates job list and filters dynamically

---

## 🛠️ Setup Instructions

### Prerequisites
- **Node.js**: v20+
- **Google Gemini API Key**: [Get one here](https://aistudio.google.com/app/apikey)
- **Adzuna API Credentials**: [Sign up here](https://developer.adzuna.com/)

### Local Setup
1. **Clone & Install**:
   ```bash
   git clone https://github.com/GUNDABADRINADH/ai-powered-job-tracking.git
   cd ai-powered-job-tracking
   ```
2. **Backend Configuration**:
   ```bash
   cd backend
   cp .env.example .env
   npm install
   # Update .env with your GEMINI_API_KEY, ADZUNA_APP_ID, and ADZUNA_APP_KEY
   npm run dev
   ```
3. **Frontend Configuration**:
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```
4. **Access**: Open `http://localhost:5173`

---

## 🤖 LangChain & LangGraph Usage

### LangChain (Job Matching)
We use the **LangChain Expression Language (LCEL)** to create a deterministic evaluation pipeline for resumes.
- **Prompt Design**: Uses a `PromptTemplate` that enforces strict JSON output, ensuring compatibility with the frontend.
- **Pipeline**: `prompt.pipe(model).pipe(parser)` handles the transformation of raw job/resume text into structured match data.

### LangGraph (AI Assistant)
The assistant uses a `StateGraph` (a state machine) to handle complex user intents.
- **Graph Structure**:
  - `detectIntentNode`: Classifies user input into `search_jobs`, `update_filters`, `clear_filters`, or `help`.
  - `extractFiltersNode`: Extracts structured entities (Location, Role, Skills) using Gemini.
  - `buildResponseNode`: Generates the final natural language response and UI action.
- **State Management**: Uses `MemorySaver` to track conversation thread IDs, allowing the assistant to remember your previous searches (e.g., "Make those remote").
- **UI Tooling**: Automatically maps AI intents to frontend actions (setting filters vs. performing fresh API fetches).

---

## ⚖️ AI Matching Logic

### Scoring Approach
We use **Semantic Similarity** and **Entity Matching** rather than simple keyword counting.
1. **Skill Analysis**: We extract `KNOWN_SKILLS` from both the resume and the job description.
2. **Contextual Evaluation**: Gemini evaluates the "depth" of experience (e.g., distinguishing between a "Python" mention and "5 years of Python").
3. **Gap Analysis**: Explicitly identifies missing skills to provide the user with actionable feedback.

### Why it Works
Traditional matching is rigid. Our LangChain implementation handles **Synonyms** (e.g., "NodeJS" vs "Node.js") and **Semantic Grouping** (e.g., knowing that "React" implies "Frontend").

---

## 🎨 Design Decisions

### Popup Flow (Application Tracking)
When a user clicks "Apply," we open a **Confirmation Popup** rather than just navigating away.
- **Reasoning**: External job applications happen on third-party sites where we lose tracking. By using a popup, we "intercept" the user intent and prompt them to save the application to their local dashboard *before* they get lost in the external tab.
- **Edge Cases**: Handles cases where the user clicks "Apply" but never actually finishes the application by allowing them to mark it as "Pending."

### AI Assistant UI (Floating Bubble)
We chose a **Floating Chat Bubble** instead of a fixed sidebar.
- **UX Reasoning**: Job searching is a visual, scanning-heavy task. A sidebar would eat up 25% of the screen real estate, forcing cards into a single column. The bubble allows the user to interact with the AI while still seeing the full feed of jobs.

---

## 📈 Scalability & Tradeoffs

### Scalability
- **100+ Jobs**: The matching service uses **Batch LangChain Calls** to score up to 50 jobs in a single prompt, significantly reducing latency compared to sequential API calls.
- **10,000 Users**: The stateless backend (Fastify) can be horizontally scaled. Note: The current JSON storage should be replaced with a database (e.g., MongoDB) for this scale.

### Tradeoffs & Known Limitations
- **JSON File DB**: We used a local JSON store for simplicity and "zero-setup" portability. Improving this would involve migrating to a cloud database.
- **Adzuna Rate Limits**: Adzuna's free tier has limits. Future improvements would include a background "Job Scraper" to cache results in a database.
- **Resume Parsing**: Currently supports `.pdf` and `.txt`. Support for `.docx` could be added using `mammoth.js`.
