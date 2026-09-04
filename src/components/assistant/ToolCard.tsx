import {
  AlarmClock,
  CalendarClock,
  CheckCircle2,
  Inbox,
  ListChecks,
  Mail,
  MailCheck,
  PenLine,
  ScrollText,
  Send,
  Sparkles,
  Wand2,
} from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";

type ToolPayload = Record<string, unknown>;

const TOOL_META: Record<string, { label: string; icon: ReactNode }> = {
  summarize_thread: { label: "Thread summary", icon: <ScrollText className="size-4" /> },
  extract_action_items: { label: "Action items", icon: <ListChecks className="size-4" /> },
  draft_email: { label: "Email draft", icon: <PenLine className="size-4" /> },
  rewrite_tone: { label: "Tone rewrite", icon: <Wand2 className="size-4" /> },
  build_meeting_agenda: { label: "Meeting agenda", icon: <CalendarClock className="size-4" /> },
  prioritize_tasks: { label: "Priorities", icon: <Sparkles className="size-4" /> },
  generate_status_update: { label: "Status update", icon: <ScrollText className="size-4" /> },
  plan_focus_blocks: { label: "Focus plan", icon: <AlarmClock className="size-4" /> },
  connect_mailbox: { label: "Mailbox connected", icon: <Mail className="size-4" /> },
  retrieve_emails: { label: "Mailbox", icon: <Inbox className="size-4" /> },
  send_email: { label: "Email sent", icon: <Send className="size-4" /> },
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </p>
      {children}
    </div>
  );
}

function Bullets({ items }: { items: string[] }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">None noted.</p>;
  return (
    <ul className="space-y-1">
      {items.map((item, index) => (
        <li key={index} className="flex gap-2 text-sm leading-relaxed">
          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary-soft" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function priorityTone(value: string) {
  if (value === "high") return "bg-primary text-primary-foreground";
  if (value === "medium") return "bg-accent text-accent-foreground";
  return "bg-muted text-muted-foreground";
}

function asStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function asRows<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function Body({ name, data }: { name: string; data: ToolPayload }) {
  if (data["requiresAuth"]) {
    return (
      <p className="text-sm leading-relaxed">
        Real mailbox actions need a signed-in account. Sign in from the top right, connect a
        mailbox, and try again — drafting works without signing in.
      </p>
    );
  }

  if (data["ok"] === false) {
    return (
      <p className="text-sm leading-relaxed text-destructive">
        {String(data["message"] ?? "That action could not be completed.")}
      </p>
    );
  }

  switch (name) {
    case "summarize_thread":
      return (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed">{String(data["headline"] ?? "")}</p>
          <Section title="Key points">
            <Bullets items={asStrings(data["key_points"])} />
          </Section>
          <Section title="Decisions">
            <Bullets items={asStrings(data["decisions"])} />
          </Section>
          <Section title="Open questions">
            <Bullets items={asStrings(data["open_questions"])} />
          </Section>
        </div>
      );

    case "extract_action_items": {
      const items = asRows<{ task: string; owner: string; due: string; priority: string }>(
        data["items"],
      );
      return (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li
              key={index}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-blush/60 px-3 py-2"
            >
              <CheckCircle2 className="size-4 shrink-0 text-primary-soft" />
              <span className="text-sm font-medium">{item.task}</span>
              <span className="text-xs text-muted-foreground">{item.owner}</span>
              <span className="text-xs text-muted-foreground">· {item.due}</span>
              <span
                className={`ml-auto rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide ${priorityTone(item.priority)}`}
              >
                {item.priority}
              </span>
            </li>
          ))}
        </ul>
      );
    }

    case "draft_email":
      return (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <span>
              <span className="text-muted-foreground">To </span>
              {String(data["to"] ?? "")}
            </span>
            <span>
              <span className="text-muted-foreground">Tone </span>
              {String(data["tone"] ?? "")}
            </span>
          </div>
          <p className="font-display text-base font-semibold">{String(data["subject"] ?? "")}</p>
          <p className="whitespace-pre-wrap rounded-xl bg-blush/50 p-3 text-sm leading-relaxed">
            {String(data["body"] ?? "")}
          </p>
        </div>
      );

    case "rewrite_tone":
      return (
        <div className="space-y-3">
          <Badge variant="secondary" className="rounded-full">
            {String(data["tone"] ?? "")}
          </Badge>
          <p className="whitespace-pre-wrap rounded-xl bg-blush/50 p-3 text-sm leading-relaxed">
            {String(data["rewritten"] ?? "")}
          </p>
        </div>
      );

    case "build_meeting_agenda": {
      const items = asRows<{ topic: string; minutes: number; owner: string }>(data["items"]);
      return (
        <div className="space-y-4">
          <div>
            <p className="font-display text-base font-semibold">{String(data["title"] ?? "")}</p>
            <p className="text-sm text-muted-foreground">
              {String(data["duration_minutes"] ?? "")} min · {String(data["goal"] ?? "")}
            </p>
          </div>
          <ol className="space-y-1.5">
            {items.map((item, index) => (
              <li key={index} className="flex items-baseline gap-3 text-sm">
                <span className="w-14 shrink-0 tabular-nums text-muted-foreground">
                  {item.minutes} min
                </span>
                <span className="font-medium">{item.topic}</span>
                <span className="text-xs text-muted-foreground">{item.owner}</span>
              </li>
            ))}
          </ol>
          <Section title="Prep">
            <Bullets items={asStrings(data["prep"])} />
          </Section>
        </div>
      );
    }

    case "prioritize_tasks": {
      const tasks = asRows<{
        task: string;
        rank: number;
        impact: string;
        urgency: string;
        why: string;
      }>(data["tasks"]);
      return (
        <ol className="space-y-2">
          {tasks.map((task, index) => (
            <li key={index} className="rounded-xl bg-blush/60 px-3 py-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="grid size-6 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {task.rank}
                </span>
                <span className="text-sm font-medium">{task.task}</span>
                <span className="ml-auto text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
                  impact {task.impact} · urgency {task.urgency}
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{task.why}</p>
            </li>
          ))}
        </ol>
      );
    }

    case "generate_status_update":
      return (
        <div className="space-y-4">
          <Badge variant="secondary" className="rounded-full">
            {String(data["period"] ?? "")}
          </Badge>
          <Section title="Highlights">
            <Bullets items={asStrings(data["highlights"])} />
          </Section>
          <Section title="Risks">
            <Bullets items={asStrings(data["risks"])} />
          </Section>
          <Section title="Next steps">
            <Bullets items={asStrings(data["next_steps"])} />
          </Section>
        </div>
      );

    case "plan_focus_blocks": {
      const blocks = asRows<{ start: string; end: string; label: string; kind: string }>(
        data["blocks"],
      );
      return (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{String(data["date_label"] ?? "")}</p>
          <ul className="space-y-1.5">
            {blocks.map((block, index) => (
              <li key={index} className="flex items-center gap-3 text-sm">
                <span className="w-28 shrink-0 tabular-nums text-muted-foreground">
                  {block.start}–{block.end}
                </span>
                <span
                  className={`size-2 rounded-full ${block.kind === "focus" ? "bg-primary" : block.kind === "meeting" ? "bg-primary-soft" : "bg-accent"}`}
                />
                <span className="font-medium">{block.label}</span>
                <span className="text-xs text-muted-foreground">{block.kind}</span>
              </li>
            ))}
          </ul>
          <Section title="Notes">
            <Bullets items={asStrings(data["notes"])} />
          </Section>
        </div>
      );
    }

    case "connect_mailbox": {
      const account = (data["account"] ?? {}) as { email_address?: string };
      return (
        <p className="flex items-center gap-2 text-sm">
          <MailCheck className="size-4 text-primary-soft" />
          Mailbox <strong>{account.email_address}</strong> is connected to your account.
        </p>
      );
    }

    case "retrieve_emails": {
      const messages = asRows<{
        id: string;
        from_address: string;
        to_address: string;
        subject: string;
        body: string;
        sent_at: string;
      }>(data["messages"]);
      if (messages.length === 0) {
        return (
          <p className="text-sm text-muted-foreground">
            No messages in {String(data["folder"] ?? "this folder")} yet.
          </p>
        );
      }
      return (
        <ul className="space-y-2">
          {messages.map((message) => (
            <li key={message.id} className="rounded-xl bg-blush/60 px-3 py-2">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-sm font-medium">{message.subject || "(no subject)"}</span>
                <span className="text-xs text-muted-foreground">
                  {String(data["folder"]) === "sent" ? message.to_address : message.from_address}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {new Date(message.sent_at).toLocaleString()}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                {message.body}
              </p>
            </li>
          ))}
        </ul>
      );
    }

    case "send_email": {
      const sent = (data["sent"] ?? {}) as { to_address?: string; subject?: string };
      return (
        <p className="flex items-center gap-2 text-sm">
          <MailCheck className="size-4 text-primary-soft" />
          Sent “{sent.subject}” to <strong>{sent.to_address}</strong>.
        </p>
      );
    }

    default:
      return (
        <pre className="overflow-x-auto rounded-xl bg-blush/50 p-3 text-xs">
          {JSON.stringify(data, null, 2)}
        </pre>
      );
  }
}

export function ToolCard({
  name,
  state,
  output,
}: {
  name: string;
  state: string;
  output?: unknown;
}) {
  const meta = TOOL_META[name] ?? { label: name.replace(/_/g, " "), icon: <Sparkles className="size-4" /> };
  const running = state !== "output-available" && state !== "output-error";

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid size-7 place-items-center rounded-full bg-blush text-primary">
          {meta.icon}
        </span>
        <span className="font-display text-sm font-semibold">{meta.label}</span>
        {running && (
          <span className="ml-auto text-xs text-muted-foreground">working…</span>
        )}
      </div>
      {running ? (
        <div className="space-y-2">
          <div className="h-3 w-3/4 animate-pulse rounded-full bg-muted" />
          <div className="h-3 w-1/2 animate-pulse rounded-full bg-muted" />
        </div>
      ) : (
        <Body name={name} data={(output ?? {}) as ToolPayload} />
      )}
    </div>
  );
}
