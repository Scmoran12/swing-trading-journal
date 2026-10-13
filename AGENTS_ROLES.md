# Project agents

Six project-scoped Codex agents are registered in `.codex/config.toml`. Each role has its own instructions in `.codex/agents/`. They inherit the session model and permissions.

| Agent identifier | Role |
| --- | --- |
| `senior_product_manager` | Senior Product Manager |
| `ux_ui_designer` | UX/UI Designer |
| `full_stack_architect_developer` | Full Stack Architect & Developer |
| `quantitative_swing_trading_analyst` | Quantitative Swing Trading Analyst |
| `ai_engineer` | AI Engineer |
| `qa_automation_engineer` | QA Automation Engineer |

## Usage

Open a new Codex session in this project so it loads the configuration. Project-local configuration may require the project to be trusted. Request an agent by its identifier or role, for example: “Use the senior_product_manager agent to define the MVP backlog.” These definitions do not start background work by themselves.

For a feature involving the whole team, ask Codex to delegate scoped tasks to the relevant roles. A typical handoff is product requirements → UX and domain specifications → implementation and AI integration → QA verification. Independent tasks can run in parallel; dependent work should wait for agreed contracts.
