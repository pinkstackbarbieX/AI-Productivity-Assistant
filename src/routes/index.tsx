import { createFileRoute, Link } from "@tanstack/react-router";
import type { UIMessage } from "ai";
import {
  AlarmClock,
  CalendarClock,
  FolderOpen,
  Inbox,
  ListChecks,
  LogOut,
  Menu,
  MessageSquarePlus,
  PenLine,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from "lucide-react";
import { useCallback, useState } from "react";

import { AssistantChat, type QuickPrompt } from "@/components/assistant/AssistantChat";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useSessions } from "@/hooks/useSessions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aria · AI workplace productivity assistant" },
      {
        name: "description",
        content:
          "Aria summarises threads, extracts action items, drafts email, builds agendas, prioritises tasks and plans focus time. Open the dashboard — no login needed.",
      },
      { property: "og:title", content: "Aria · AI workplace productivity assistant" },
      {
        property: "og:description",
        content:
          "Summarise threads, draft email, build agendas, prioritise work and plan focus time in one calm workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const TOOLS = [
  {
    name: "Summarise a thread",
    icon: ScrollText,
    prompt:
      "Summarise this thread into a headline, key points, decisions and open questions:\n\n(paste the thread here)",
  },
  {
    name: "Extract action items",
    icon: ListChecks,
    prompt: "Pull the action items with owners, due dates and priority out of this:\n\n(paste here)",
  },
  {
    name: "Draft an email",
    icon: PenLine,
    prompt: "Draft a friendly email declining a meeting invite and proposing an async update instead.",
  },
  {
    name: "Rewrite the tone",
    icon: Wand2,
    prompt: "Rewrite this in a warmer, more concise tone:\n\n(paste here)",
  },
  {
    name: "Build a meeting agenda",
    icon: CalendarClock,
    prompt: "Build a 30 minute agenda for a weekly project sync with three workstream leads.",
  },
  {
    name: "Prioritise my tasks",
    icon: Sparkles,
    prompt:
      "Prioritise these tasks by impact and urgency: finish Q3 deck, reply to legal, review two PRs, book venue, update roadmap.",
  },
  {
    name: "Write a status update",
    icon: ScrollText,
    prompt: "Write this week's stakeholder status update for the onboarding redesign project.",
  },
  {
    name: "Plan focus blocks",
    icon: AlarmClock,
    prompt:
      "Plan my focus blocks for tomorrow. I have standup at 9:30, a client call 14:00–15:00 and need three hours of deep work.",
  },
  {
    name: "Connect my mailbox",
    icon: Inbox,
    prompt: "Connect my work mailbox so you can retrieve and send email for me.",
    requiresAuth: true,
  },
];

const QUICK_PROMPTS: QuickPrompt[] = [
  {
    label: "Catch me up",
    prompt:
      "Summarise this thread into a headline, key points, decisions and open questions:\n\n(paste the thread here)",
  },
  {
    label: "Turn notes into actions",
    prompt: "Pull the action items with owners, due dates and priority out of my meeting notes:\n\n(paste here)",
  },
  {
    label: "Draft a reply",
    prompt: "Draft a polite reply asking for a two-day extension on a deliverable.",
  },
  {
    label: "Protect my focus",
    prompt:
      "Plan my focus blocks for tomorrow. I have standup at 9:30, a client call 14:00–15:00 and need three hours of deep work.",
  },
];

function Dashboard() {
  const { sessions, activeSession, activeId, hydrated, setActiveId, startSession, removeSession, saveMessages } =
    useSessions();
  const { user, signOut } = useAuth();
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleMessages = useCallback(
    (messages: UIMessage[]) => {
      if (messages.length === 0) return;
      saveMessages(activeId, messages);
    },
    [activeId, saveMessages],
  );

  const runTool = (prompt: string) => {
    setPendingPrompt(prompt);
    setSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-background">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[19rem] flex-col border-r border-sidebar-border bg-sidebar transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-2 px-5 py-5">
          <span className="grid size-9 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <Sparkles className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="font-display text-base font-semibold leading-tight">Aria</p>
            <p className="truncate text-xs text-muted-foreground">Workplace assistant</p>
          </div>
          <button
            type="button"
            className="ml-auto rounded-full p-1.5 text-muted-foreground lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-3 pb-6">
          <div className="space-y-2">
            <Button
              className="w-full justify-start gap-2"
              onClick={() => {
                startSession();
                setSidebarOpen(false);
              }}
            >
              <MessageSquarePlus className="size-4" /> New session
            </Button>
            <Button asChild variant="outline" className="w-full justify-start gap-2">
              <Link to="/organizer" onClick={() => setSidebarOpen(false)}>
                <FolderOpen className="size-4" /> Organizer
              </Link>
            </Button>
          </div>

          <section>
            <h2 className="px-2 pb-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Tools
            </h2>
            <ul className="space-y-0.5">
              {TOOLS.map((tool) => (
                <li key={tool.name}>
                  <button
                    type="button"
                    onClick={() => runTool(tool.prompt)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm transition-colors hover:bg-sidebar-accent"
                  >
                    <tool.icon className="size-4 shrink-0 text-primary-soft" />
                    <span className="min-w-0 flex-1 truncate">{tool.name}</span>
                    {tool.requiresAuth && !user && (
                      <span className="rounded-full bg-blush px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-primary">
                        sign in
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="px-2 pb-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Session history
            </h2>
            {!hydrated ? (
              <p className="px-2.5 text-sm text-muted-foreground">Loading…</p>
            ) : (
              <ul className="space-y-0.5">
                {sessions.map((session) => (
                  <li key={session.id} className="group flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveId(session.id);
                        setSidebarOpen(false);
                      }}
                      className={`min-w-0 flex-1 rounded-xl px-2.5 py-2 text-left text-sm transition-colors ${
                        session.id === activeId
                          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                          : "hover:bg-sidebar-accent/60"
                      }`}
                    >
                      <span className="block truncate">{session.title}</span>
                      <span className="block text-[0.7rem] text-muted-foreground">
                        {new Date(session.updatedAt).toLocaleDateString()} ·{" "}
                        {session.messages.length} messages
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${session.title}`}
                      onClick={() => removeSession(session.id)}
                      className="rounded-lg p-1.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="border-t border-sidebar-border px-4 py-4">
          <div className="rounded-2xl bg-blush/70 p-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
              <ShieldCheck className="size-3.5" /> Responsible AI
            </p>
            <p className="mt-1.5 text-[0.72rem] leading-relaxed text-muted-foreground">
              Aria assists, it does not decide. Answers can be wrong or out of date — check names,
              dates and figures. Nothing is emailed without your explicit confirmation, and mailbox
              data stays private to your account.
            </p>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border/70 bg-card/70 px-4 py-3 backdrop-blur sm:px-8">
          <button
            type="button"
            className="rounded-xl p-2 text-muted-foreground lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate font-display text-lg font-semibold">
              {activeSession?.title ?? "New session"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {user ? `Mailbox actions enabled · ${user.email}` : "Open access · sign in only for real email"}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {user ? (
              <Button variant="ghost" size="sm" onClick={() => void signOut()} className="gap-1.5">
                <LogOut className="size-4" /> Sign out
              </Button>
            ) : (
              <Button asChild size="sm" variant="outline">
                <Link to="/auth">Sign in</Link>
              </Button>
            )}
          </div>
        </header>

        {hydrated && activeSession ? (
          <AssistantChat
            key={activeSession.id}
            sessionId={activeSession.id}
            initialMessages={activeSession.messages}
            onMessagesChange={handleMessages}
            quickPrompts={QUICK_PROMPTS}
            pendingPrompt={pendingPrompt}
            onPendingPromptHandled={() => setPendingPrompt(null)}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Loading your workspace…
          </div>
        )}
      </div>
    </div>
  );
}
