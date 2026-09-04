# Aria — AI Workplace Productivity Assistant

# AI Workplace Productivity Assistant

## Project Overview

**AI Workplace Productivity Assistant** is an AI-powered workplace productivity web application that brings multiple workplace tasks into one streamlined workspace.

The application uses an interface with a central workspace and sidebar navigation, allowing users to easily switch between different AI productivity tasks.

## Features

* Smart Email Generator
* Email Threads
* Meeting Summarizer
* AI Task Planner
* AI Research Assistant
* AI Workplace Chat
* Editable AI-generated outputs
* Responsive design
* Responsible AI disclaimer
* Modern dashboard interface
* Sidebar task navigation

## Tools Used

* **Lovable** - Application design and development
* **Lovable Cloud** - Cloud and backend functionality
* **AI Integration** - Powers the AI productivity features
* **GitHub** - Source code management and version control

## Setup Instructions

No installation is required to use the published web application.

1. Open the **AI Workplace Productivity Assistant** website.
2. The application opens directly to the main workspace.
3. Select a task from the sidebar.
4. Enter the required information.
5. Submit the request to generate an AI response.
6. Review and edit the generated output.
7. Copy or use the completed result.

General productivity features can be used without creating an account.

Authentication is only required when a feature needs access to a user's email account, such as retrieving or sending real emails.

## Team Members

**Individual Project**

* **Developer:** Siyahluma Mihlali Kobese

Aria is a calm, pastel-pink and burgundy workspace that helps knowledge workers get through the
day: summarise long threads, pull out action items, draft and retune email, build meeting agendas,
prioritise tasks, write status updates and protect focus time.

The app opens **straight to the dashboard** — no login wall. Signing in is optional and only
required for actions that touch a real mailbox.

## Features

- **Assistant dashboard** — chat surface with quick prompts, a tool palette and session history.
- **Named AI tools**, each rendered as a structured card:
  - `summarize_thread` — headline, key points, decisions, open questions
  - `extract_action_items` — task, owner, due date, priority
  - `draft_email` — recipient, subject, body, tone
  - `rewrite_tone` — same meaning, new tone
  - `build_meeting_agenda` — timeboxed items, owners, prep
  - `prioritize_tasks` — ranked with impact, urgency and reasoning
  - `generate_status_update` — highlights, risks, next steps
  - `plan_focus_blocks` — focus/meeting/admin/break blocks across the day
  - `connect_mailbox` *(sign-in required)* — connect a work mailbox
  - `retrieve_emails` *(sign-in required)* — read recent inbox or sent messages
  - `send_email` *(sign-in required)* — send from the connected mailbox after explicit confirmation
- **Session history** — sessions are kept in the browser (localStorage), so history works without
  an account. Rename-free: titles come from the first message. Sessions can be switched or deleted.
- **Responsible AI notice** — always visible in the sidebar, plus a reminder under the composer.
- **Optional authentication** — email/password and Google sign-in, used only to unlock mailbox
  connect / send / retrieve.
- **Responsive premium design** — pastel pink surfaces, deep burgundy ink, Fraunces display type
  and Manrope body type, soft elevation, collapsible sidebar on mobile.

## How it works

| Layer | Detail |
| --- | --- |
| Framework | TanStack Start (React 19, Vite, Tailwind CSS v4) |
| AI | Lovable AI Gateway via the AI SDK, called only from the server route `src/routes/api/chat.ts` |
| Backend | Lovable Cloud (Postgres + auth) |
| Mail data | `mail_accounts` and `mail_messages`, protected by row-level security so only the owner can read or write their rows |

The AI key never reaches the browser: the chat route runs server-side, streams the response, and
executes tools there. Mailbox tools require a bearer token from the signed-in session; without one
they return a "sign in required" result that the UI explains in plain language.

## Privacy and safety

- Conversation history stays in your browser; it is not uploaded.
- Mailbox rows are scoped to your account by database policies.
- Aria never sends an email without an explicit recipient and your confirmation in the chat.
- Aria assists, it does not decide. Verify names, dates and figures before acting.

## Local development

```sh
npm i
npm run dev
```

Environment variables for the backend and the AI gateway are provisioned by Lovable Cloud.
