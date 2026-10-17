# SwingPilot AI — Full Project Planning & Development Roadmap

## YOUR ROLE

Act as a team of senior professionals:

- Senior Software Architect
- Senior Full-Stack Developer
- AI Engineer
- Quantitative Trading Systems Engineer
- Database Architect
- UI/UX Designer
- DevOps Engineer
- QA Automation Engineer
- Technical Project Manager

Your responsibility is to plan the development of **SwingPilot AI**, a complete AI-powered swing trading planning, monitoring, and journaling platform.

## CRITICAL INSTRUCTION — PLANNING FIRST

**DO NOT START IMPLEMENTING OR WRITING APPLICATION CODE YET.**

Your first task is to create a comprehensive technical implementation plan for the entire project.

I want to understand:

1. Exactly what we are building.
2. How the system will work.
3. Which technologies and services we will use.
4. How the components will communicate.
5. How the database will be structured.
6. How AI will interact with market data and trade plans.
7. How background monitoring and notifications will work.
8. How to minimize operational costs.
9. The exact development phases.
10. What will be delivered in each phase.
11. How we will test and verify each phase.
12. What dependencies and risks must be addressed.

**Stop after presenting the complete plan and wait for my approval before starting implementation.**

---

# 1. PROJECT OVERVIEW

Build a personal, AI-powered swing trading platform called SwingPilot AI.

The system should cover the full trading lifecycle:

1. Upload weekly screenshots containing interesting stocks.
2. Extract ticker symbols from screenshots using AI.
3. Analyze each stock using real market data.
4. Discover five additional attractive swing trading candidates.
5. Generate detailed AI trading plans.
6. Allow the user to edit each plan before approval.
7. Move approved plans to a Waiting for Entry watchlist.
8. Automatically monitor stocks for entry conditions.
9. Notify the user when a valid setup is detected.
10. Let the user manually record a purchase.
11. Require recording the user's emotional state when buying.
12. Move purchased stocks to Active Trades.
13. Allow requesting updated AI recommendations for active positions.
14. Track partial exits, stop changes and position management.
15. Close trades and record results.
16. Analyze trading performance and trading psychology.

This must become a real, functional application, not just a visual dashboard.

---

# 2. CONFIRMED REQUIREMENTS

These decisions are already finalized:

**Trading**
- US-listed stocks only (NYSE and Nasdaq).
- Long swing trades only in V1.
- Expected holding period: days to weeks.
- Manual brokerage execution.
- Whole-share position sizing by default.
- Configurable portfolio capital and risk preferences.
- Interactive Brokers integration is postponed to a later version.

**Monitoring**
- Check approved watchlist stocks every US trading day at 22:40 Asia/Jerusalem.
- Perform another check after the US stock market officially closes.
- Handle US market holidays, early closes and timezone differences.
- All background monitoring must work while the website is closed.

**Market Data**
- Minimize monthly costs.
- Prefer a free or inexpensive End-of-Day market data provider initially.
- Explicitly distinguish EOD data from live data.
- Never generate actionable real-time buy alerts using stale prices.
- Allow future upgrades to real-time data without rewriting the system.

**Application**
- Hebrew UI with complete RTL support.
- Modern dark trading dashboard.
- Responsive desktop and mobile layouts.
- Installable iPhone PWA.
- Push notifications.
- Secure user authentication.
- Real database persistence.

**AI**
- AI-powered screenshot recognition.
- Structured trade plan generation.
- Data-driven discovery of five additional stock opportunities.
- AI analysis of active trades.
- Trading journal insights.
- Trading psychology analysis.

**Budget**
- Keep fixed monthly expenses as low as reasonably possible.
- Prefer free tiers and open-source libraries.
- Pay for AI API usage only when needed.
- Avoid unnecessary infrastructure complexity.

---

# 3. YOUR FIRST DELIVERABLE — COMPLETE SYSTEM ARCHITECTURE

Design and explain the complete architecture before building anything.

Recommend the best technologies for:

- Frontend framework.
- Backend framework.
- Database.
- Authentication.
- Market data provider.
- AI provider.
- Charting library.
- Background job scheduling.
- Notifications.
- File storage.
- Hosting.
- Automated testing.
- Monitoring and logging.

Preferred technologies to evaluate:

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase
- Massive market data API
- OpenAI or another suitable AI API
- TradingView Lightweight Charts
- Supabase Cron / Edge Functions
- Web Push
- Playwright
- Vitest
- Vercel

Do not automatically accept these choices.

Evaluate their current costs, compatibility, limitations and suitability.

### Architecture Diagram

Provide a Mermaid diagram showing the relationships between:

Frontend → Backend → Database → AI Services → Market Data → Scheduler → Notifications.

Explain how information flows between the different components.

---

# 4. DATABASE DESIGN

Before implementation, design the complete database.

Explain:

- Tables and their purposes.
- Primary and foreign keys.
- Relationships.
- Constraints and indexes.
- Row Level Security.
- Plan versioning.
- Trade execution history.
- Partial position exits.
- Emotion journal storage.
- AI analysis history.
- Notification storage.
- Market data caching.
- Data retention and backups.

Provide an Entity Relationship Diagram.

Design the schema to support future features without unnecessary complexity in V1.

---

# 5. AI SYSTEM DESIGN

Plan how AI will work throughout the application.

Separate the AI system into logical modules:

### Screenshot Analyzer
Extracts and validates ticker symbols from uploaded screenshots.

### Market Research Engine
Retrieves real financial and technical information.

### Stock Discovery Engine
Uses quantitative screening to discover additional swing trading candidates.

### Trade Plan Generator
Creates structured plans containing:

- Entry conditions.
- Entry zone.
- Stop loss.
- Invalidation conditions.
- Profit targets.
- Risk/reward.
- Position sizing.
- Technical indicators.
- Estimated holding period.
- Trading thesis.
- Important risks.

### Entry Monitoring Engine
Evaluates approved entry conditions against market data.

### Active Trade Advisor
Reviews active positions and produces reasoned HOLD, REDUCE, EXIT, ADD or REVIEW_REQUIRED assessments.

### Trading Psychology Analyzer
Analyzes trading behavior and emotional patterns.

### Performance Analyzer
Evaluates strategy performance and identifies potential improvements.

For each module explain:

- Input.
- Output.
- Required external data.
- AI model responsibilities.
- Deterministic calculations.
- Trigger mechanism.
- Database interaction.
- Estimated resource usage.
- Failure handling.
- Testing strategy.

The AI must not invent market prices, technical indicators or trading history.

---

# 6. COMPLETE USER EXPERIENCE PLAN

Define every application screen.

At minimum:

1. Dashboard
2. Weekly AI Scanner
3. Stock Research
4. Trade Plan Editor
5. Waiting for Entry
6. Active Trades
7. Individual Trade Details
8. Trading Journal
9. Performance Analytics
10. Settings

For every screen provide:

- Purpose.
- Main UI components.
- Data displayed.
- User actions.
- Required backend endpoints.
- Required database entities.
- Loading states.
- Error states.
- Mobile layout considerations.

Describe the complete user journey from screenshot upload to trade closure.

Provide a trade lifecycle state machine, including exceptional states and valid transitions.

---

# 7. AUTOMATED MONITORING PLAN

Create a complete technical design for monitoring.

The system must perform:

- A scheduled check at 22:40 Asia/Jerusalem on US trading days.
- An additional check after the official US market close.

Explain:

- Scheduler architecture.
- Exchange calendar integration.
- Daylight saving handling.
- Market data retrieval.
- Rate limiting.
- Retry mechanisms.
- Duplicate execution prevention.
- Entry trigger evaluation.
- Risk validation.
- Signal generation.
- Push delivery.
- Failure recovery.

Explain clearly how EOD data limitations affect these checks.

An EOD-based alert must not pretend to be a real-time execution signal.

---

# 8. RISK MANAGEMENT DESIGN

Plan deterministic financial calculations for:

- Risk per share.
- Maximum capital at risk.
- Position sizing.
- Buying power.
- Reward-to-risk.
- Stop-loss validation.
- Portfolio exposure.
- Sector concentration.
- Realized P&L.
- Unrealized P&L.
- R multiples.
- Partial exits.

Define the rules for identifying invalid or excessively risky trades.

All critical financial calculations must be tested independently of AI.

---

# 9. COMPLETE DEVELOPMENT PHASES

This is one of the most important sections.

**Divide the entire development process into clear, sequential phases.**

Start with the proposed phases below, but improve or reorganize them if you can justify doing so.

### Phase 1 — Project Foundation

Project initialization, architecture setup, database, authentication, design system, responsive layout and core navigation.

### Phase 2 — Trading Lifecycle

Trade plan creation and editing, approval workflow, watchlist, manual buy registration, mandatory emotion journal, active positions, partial exits and trade closure.

### Phase 3 — Market Data Integration

Market data provider integration, data caching, historical candles, technical indicators, stock validation and market screening infrastructure.

### Phase 4 — AI Trading Intelligence

Screenshot extraction, AI trade plans, five additional candidate stocks, structured outputs, research explanations and validation.

### Phase 5 — Automated Market Monitoring

Scheduled daily scans, signal engine, entry detection, invalidation rules, monitoring history and background reliability.

### Phase 6 — Mobile Push Notifications

PWA installation, service worker, push subscriptions, notification delivery, deep links and notification preferences.

### Phase 7 — Advanced Trading Journal

Performance analytics, trading psychology, weekly AI reviews, plan adherence and historical insights.

### Phase 8 — Production Readiness

Security hardening, testing, cost optimization, production deployment, documentation, backups and operational monitoring.

For EACH phase provide:

**A. Objective**

What the phase is intended to accomplish.

**B. Features**

Every feature included in the phase.

**C. Technical Tasks**

The implementation tasks required to deliver those features.

Break large tasks into smaller actionable subtasks.

**D. Dependencies**

Which earlier components must exist.

**E. Deliverables**

The concrete artifacts, pages, services, APIs and database components that will be completed.

**F. Verification**

How to prove the phase works.

Include automated tests and manual verification where relevant.

**G. Definition of Done**

Specific acceptance criteria that must be satisfied before moving on.

**H. Risks and Challenges**

Potential problems and proposed solutions.

**I. Estimated Complexity**

Classify as Low, Medium or High, and include a reasoned development effort estimate if feasible.

**J. Cost Impact**

Explain whether the phase introduces any recurring expenses.

**K. Implementation Priority**

Mark as MVP-critical, post-MVP or optional.

---

# 10. PHASE DEPENDENCY MAP

Provide a Mermaid diagram showing:

- Development phase sequence.
- Dependencies between phases.
- What can be developed in parallel.
- What must be completed first.
- External services that could block progress.

Identify the critical path to the first usable MVP.

---

# 11. MVP DEFINITION

Clearly explain the minimum viable product.

I want the smallest practical version that already supports a complete trading lifecycle.

Specify:

- Which features are essential for launch.
- Which features can be introduced later.
- Which integrations can initially use clearly labeled fixtures.
- Which features must work with real data before production use.
- What constitutes the first version I can actually use for trading journaling.

Do not sacrifice database correctness, financial calculations, user security or trade history integrity to speed up the MVP.

---

# 12. PROJECT STRUCTURE

Propose a maintainable repository structure.

Show the expected folder hierarchy for:

- App routes.
- UI components.
- Domain/business logic.
- Trading calculation engine.
- AI integrations.
- Market data adapters.
- Database access.
- Background jobs.
- Notifications.
- Tests.
- Configuration.
- Documentation.

Explain how the modules will communicate and how circular dependencies will be avoided.

---

# 13. API DESIGN

List the main application APIs and their responsibilities.

Include endpoints or server actions for:

- Uploading screenshots.
- Validating tickers.
- Running AI scans.
- Generating plans.
- Updating plans.
- Approving plans.
- Fetching the watchlist.
- Recording purchases.
- Updating positions.
- Recording exits.
- Requesting AI recommendations.
- Running market monitoring.
- Managing notifications.
- Retrieving trading analytics.

For each API define the authentication requirements and expected request/response contracts.

---

# 14. COST OPTIMIZATION

Propose the least expensive practical implementation.

Provide a service cost table containing:

- Provider.
- Service purpose.
- Free-tier availability.
- Usage limitations.
- Expected fixed monthly cost.
- Potential variable cost.
- Upgrade conditions.
- Suggested alternatives.

Estimate the cost drivers for:

- Weekly AI scans.
- Screenshot processing.
- Daily market monitoring.
- AI trade recommendations.
- Hosting.
- Database storage.
- Notifications.

Explain how caching, batching, deterministic screening and selective AI analysis reduce costs.

Do not invent prices or claim that a service is free without checking its current terms.

---

# 15. TESTING STRATEGY

Design automated testing across the project.

Include:

- Unit tests.
- Integration tests.
- End-to-end Playwright tests.
- Database tests.
- API contract tests.
- Scheduler tests.
- Timezone/DST tests.
- Financial calculation tests.
- Notification tests.
- Error recovery tests.
- Security tests.

Identify which tests belong to each phase.

Explain the test environments and what must be mocked versus tested with real services.

---

# 16. DEVELOPMENT WORKFLOW

Describe how development should be managed with an AI coding agent.

Recommend:

- A milestone/task tracking approach.
- A phase-specific implementation prompt.
- Git branching and commit strategy.
- Documentation update requirements.
- Test execution requirements.
- Code review checkpoints.
- How to avoid breaking previously completed features.
- How to resume development in a new Codex or Claude Code conversation.
- How to track blockers and unfinished work.

Create a proposed documentation structure, including:

- PRODUCT_SPEC.md
- ARCHITECTURE.md
- DATABASE.md
- ROADMAP.md
- TASKS.md
- API_DESIGN.md
- TEST_PLAN.md
- DECISIONS.md

The documentation should serve as a durable source of truth for future coding sessions.

---

# 17. REQUIRED OUTPUT FORMAT

Present your response in this exact order:

1. **Executive Summary** — What we are building and recommended approach.
2. **Final